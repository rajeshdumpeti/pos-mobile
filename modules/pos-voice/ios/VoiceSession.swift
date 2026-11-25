import AVFoundation
import ExpoModulesCore
import Speech

typealias VoiceEmitter = @MainActor (String, [String: Any?]) -> Void

struct VoiceStartConfig {
  let maxDurationMs: Int
  let silenceTimeoutMs: Int
  let contextualStrings: [String]
}

/// Owns the single active session. Main-actor isolated so state changes are serialized.
@available(iOS 26.0, *)
@MainActor
final class VoiceController {
  private var session: VoiceSession?
  private let emit: VoiceEmitter

  nonisolated init(emit: @escaping VoiceEmitter) { self.emit = emit }

  func start(config: VoiceStartConfig) async throws {
    guard session == nil else { throw VoiceException("already_active") }
    let created = VoiceSession(config: config, emit: emit) { [weak self] ended in
      if self?.session === ended { self?.session = nil }
    }
    session = created
    do {
      try await created.start()
    } catch {
      if session === created { session = nil }
      throw error
    }
  }

  func stop() async { await session?.end("stopped", deliverFinal: true) }
  func cancel() async { await session?.end("cancelled", deliverFinal: false) }
  func handleBackground() async { await session?.end("backgrounded", deliverFinal: false) }
}

@available(iOS 26.0, *)
@MainActor
final class VoiceSession {
  private let config: VoiceStartConfig
  private let emit: VoiceEmitter
  private let onClosed: (VoiceSession) -> Void

  private let engine = AVAudioEngine()
  private var analyzer: SpeechAnalyzer?
  private var inputContinuation: AsyncStream<AnalyzerInput>.Continuation?
  private var resultsTask: Task<Void, Never>?
  private var maxTimer: Task<Void, Never>?
  private var silenceTimer: Task<Void, Never>?
  private var observers: [NSObjectProtocol] = []

  private var tapInstalled = false
  private var sessionActivated = false
  private var listening = false
  private var closing = false
  private var closed = false
  /// stop/cancel/background that arrived while start() was still awaiting.
  private var pendingEnd: (reason: String, deliverFinal: Bool)?

  private var finalizedText = ""
  private var volatileText = ""
  private var lastEmitted = ""

  init(
    config: VoiceStartConfig, emit: @escaping VoiceEmitter,
    onClosed: @escaping (VoiceSession) -> Void
  ) {
    self.config = config
    self.emit = emit
    self.onClosed = onClosed
  }

  // MARK: - Start

  func start() async throws {
    emit("onStateChange", ["state": "starting"])
    do {
      try await prepareAndRun()
    } catch {
      let code = Self.code(for: error)
      await teardown()
      emit("onStateChange", ["state": "ended"])
      emit("onEnd", ["reason": "error", "code": code])
      closed = true
      onClosed(self)
      throw error is VoiceException ? error : VoiceException(code)
    }
    if let pending = pendingEnd {
      await end(pending.reason, deliverFinal: pending.deliverFinal)
    }
  }

  private func prepareAndRun() async throws {
    // Fail closed: no on-device model + permissions => no listening, no fallback.
    let availability = await VoiceAvailability.check()
    guard availability.status == "available" else {
      throw VoiceException(availability.status)
    }
    guard let locale = await VoiceAvailability.resolveLocale() else {
      throw VoiceException("unsupported_locale")
    }
    let transcriber = DictationTranscriber(locale: locale, preset: .progressiveShortDictation)

    if !(await AssetInventory.reservedLocales).contains(where: {
      $0.identifier(.bcp47) == locale.identifier(.bcp47)
    }) {
      _ = try await AssetInventory.reserve(locale: locale)
    }

    let avSession = AVAudioSession.sharedInstance()
    try avSession.setCategory(.record, mode: .default, options: [])
    try avSession.setActive(true)
    sessionActivated = true
    observeSystemEvents(avSession)

    let inputFormat = engine.inputNode.outputFormat(forBus: 0)
    guard inputFormat.sampleRate > 0, inputFormat.channelCount > 0 else {
      throw VoiceException("no_audio_input")
    }
    // Prefer the best format for this microphone; fall back to any format the transcriber
    // supports. The converter below handles the difference. Still fail closed if none exist.
    var resolvedFormat = await SpeechAnalyzer.bestAvailableAudioFormat(
      compatibleWith: [transcriber], considering: inputFormat)
    if resolvedFormat == nil {
      resolvedFormat = await SpeechAnalyzer.bestAvailableAudioFormat(compatibleWith: [transcriber])
    }
    if resolvedFormat == nil {
      resolvedFormat = await transcriber.availableCompatibleAudioFormats.first
    }
    #if targetEnvironment(simulator)
      // Simulator-only aid: the simulator may report no formats. The analyzer still validates
      // this format in prepareToAnalyze and fails with a code if it is unsupported.
      if resolvedFormat == nil {
        resolvedFormat = AVAudioFormat(
          commonFormat: .pcmFormatInt16, sampleRate: 16_000, channels: 1, interleaved: false)
      }
    #endif
    guard let analyzerFormat = resolvedFormat else { throw VoiceException("no_audio_format") }
    guard let converter = AVAudioConverter(from: inputFormat, to: analyzerFormat) else {
      throw VoiceException("audio_converter_unavailable")
    }

    let analyzer = SpeechAnalyzer(
      modules: [transcriber],
      options: .init(priority: .userInitiated, modelRetention: .whileInUse))
    self.analyzer = analyzer

    if !config.contextualStrings.isEmpty {
      let context = AnalysisContext()
      context.contextualStrings[.general] = config.contextualStrings
      try? await analyzer.setContext(context)  // best effort; vocabulary is optional
    }
    try await analyzer.prepareToAnalyze(in: analyzerFormat)

    let (stream, continuation) = AsyncStream.makeStream(of: AnalyzerInput.self)
    inputContinuation = continuation
    try await analyzer.start(inputSequence: stream)

    resultsTask = Task { [weak self] in
      do {
        for try await result in transcriber.results {
          await self?.handleResult(text: String(result.text.characters), isFinal: result.isFinal)
        }
      } catch is CancellationError {
        // Normal on cancel.
      } catch {
        await self?.end("error", deliverFinal: false, code: Self.code(for: error))
      }
    }

    installTap(inputFormat: inputFormat, analyzerFormat: analyzerFormat, converter: converter, continuation: continuation)
    engine.prepare()
    try engine.start()

    listening = true
    emit("onStateChange", ["state": "listening"])
    startMaxTimer()
  }

  // MARK: - Audio

  private func installTap(
    inputFormat: AVAudioFormat, analyzerFormat: AVAudioFormat, converter: AVAudioConverter,
    continuation: AsyncStream<AnalyzerInput>.Continuation
  ) {
    let sameFormat = inputFormat == analyzerFormat
    engine.inputNode.installTap(onBus: 0, bufferSize: 4096, format: inputFormat) { buffer, _ in
      // Audio thread. Buffers live in memory only and are handed straight to the analyzer.
      if sameFormat {
        continuation.yield(AnalyzerInput(buffer: buffer))
        return
      }
      let ratio = analyzerFormat.sampleRate / inputFormat.sampleRate
      let capacity = AVAudioFrameCount((Double(buffer.frameLength) * ratio).rounded(.up)) + 1
      guard let out = AVAudioPCMBuffer(pcmFormat: analyzerFormat, frameCapacity: capacity) else {
        return
      }
      var supplied = false
      var conversionError: NSError?
      let status = converter.convert(to: out, error: &conversionError) { _, inputStatus in
        if supplied {
          inputStatus.pointee = .noDataNow
          return nil
        }
        supplied = true
        inputStatus.pointee = .haveData
        return buffer
      }
      if status != .error, conversionError == nil, out.frameLength > 0 {
        continuation.yield(AnalyzerInput(buffer: out))
      }
    }
    tapInstalled = true
  }

  private func observeSystemEvents(_ avSession: AVAudioSession) {
    let center = NotificationCenter.default
    observers.append(
      center.addObserver(
        forName: AVAudioSession.interruptionNotification, object: avSession, queue: .main
      ) { [weak self] note in
        let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt
        guard raw == AVAudioSession.InterruptionType.began.rawValue else { return }
        Task { @MainActor in await self?.end("interrupted", deliverFinal: false) }
      })
    observers.append(
      center.addObserver(
        forName: .AVAudioEngineConfigurationChange, object: engine, queue: .main
      ) { [weak self] _ in
        Task { @MainActor in
          await self?.end("error", deliverFinal: false, code: "audio_config_changed")
        }
      })
  }

  // MARK: - Results and timers

  private func handleResult(text: String, isFinal: Bool) {
    guard !closed else { return }
    if isFinal {
      finalizedText = Self.join(finalizedText, text)
      volatileText = ""
    } else {
      volatileText = text
    }
    let combined = Self.join(finalizedText, volatileText)
    guard combined != lastEmitted else { return }
    lastEmitted = combined
    emit("onPartial", ["text": combined])
    if !combined.isEmpty, listening, !closing { restartSilenceTimer() }
  }

  private func startMaxTimer() {
    let nanos = UInt64(max(config.maxDurationMs, 1)) * 1_000_000
    maxTimer = Task { [weak self] in
      try? await Task.sleep(nanoseconds: nanos)
      guard !Task.isCancelled else { return }
      await self?.end("max_duration", deliverFinal: true)
    }
  }

  private func restartSilenceTimer() {
    silenceTimer?.cancel()
    let nanos = UInt64(max(config.silenceTimeoutMs, 1)) * 1_000_000
    silenceTimer = Task { [weak self] in
      try? await Task.sleep(nanoseconds: nanos)
      guard !Task.isCancelled else { return }
      await self?.end("silence", deliverFinal: true)
    }
  }

  // MARK: - End

  func end(_ reason: String, deliverFinal: Bool, code: String? = nil) async {
    if !listening && !closed {
      // start() still in flight: remember the request and apply it once listening.
      if pendingEnd == nil { pendingEnd = (reason, deliverFinal) }
      return
    }
    guard !closing, !closed else { return }
    closing = true
    maxTimer?.cancel()
    silenceTimer?.cancel()
    emit("onStateChange", ["state": "finishing"])

    // Stop capturing first so the microphone is released as early as possible.
    stopAudioCapture()

    var finalText: String?
    if deliverFinal, let analyzer {
      do { try await analyzer.finalizeAndFinishThroughEndOfInput() } catch {}
      await waitForResults(timeoutSeconds: 4)
      finalText = Self.join(finalizedText, volatileText)
    } else {
      resultsTask?.cancel()
      if let analyzer { await analyzer.cancelAndFinishNow() }
    }

    await teardown()
    closed = true
    if let finalText { emit("onFinal", ["text": finalText]) }
    emit("onStateChange", ["state": "ended"])
    var payload: [String: Any?] = ["reason": reason]
    if let code { payload["code"] = code }
    emit("onEnd", payload)
    onClosed(self)
  }

  private func stopAudioCapture() {
    if tapInstalled {
      engine.inputNode.removeTap(onBus: 0)
      tapInstalled = false
    }
    if engine.isRunning { engine.stop() }
    inputContinuation?.finish()
    inputContinuation = nil
  }

  private func waitForResults(timeoutSeconds: UInt64) async {
    guard let task = resultsTask else { return }
    await withTaskGroup(of: Void.self) { group in
      group.addTask { await task.value }
      group.addTask {
        do {
          try await Task.sleep(nanoseconds: timeoutSeconds * 1_000_000_000)
          task.cancel()
        } catch {}
      }
      await group.next()
      group.cancelAll()
    }
  }

  /// Releases everything: engine, tap, analyzer, observers, audio session.
  private func teardown() async {
    maxTimer?.cancel()
    silenceTimer?.cancel()
    resultsTask?.cancel()
    stopAudioCapture()
    observers.forEach { NotificationCenter.default.removeObserver($0) }
    observers.removeAll()
    analyzer = nil
    resultsTask = nil
    if sessionActivated {
      try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
      sessionActivated = false
    }
    finalizedText = ""
    volatileText = ""
  }

  // MARK: - Helpers

  private static func join(_ a: String, _ b: String) -> String {
    let left = a.trimmingCharacters(in: .whitespaces)
    let right = b.trimmingCharacters(in: .whitespaces)
    if left.isEmpty { return right }
    if right.isEmpty { return left }
    return left + " " + right
  }

  /// Error codes only. Never include error descriptions (they could carry content).
  private static func code(for error: Error) -> String {
    if let voice = error as? VoiceException { return voice.code }
    let ns = error as NSError
    if ns.domain == SFSpeechError.errorDomain { return "speech_error_\(ns.code)" }
    return "native_error_\(abs(ns.code))"
  }
}

import ExpoModulesCore

struct PosVoiceStartOptions: Record {
  @Field var locale: String = "en-US"
  @Field var maxDurationMs: Int = 30_000
  @Field var silenceTimeoutMs: Int = 1_500
  @Field var contextualStrings: [String]?
}

public class PosVoiceModule: Module {
  // VoiceController is iOS 26+, so it is stored type-erased.
  private var controllerStorage: Any?

  public func definition() -> ModuleDefinition {
    Name("PosVoice")

    Events("onStateChange", "onPartial", "onFinal", "onEnd")

    OnCreate {
      if #available(iOS 26.0, *) {
        self.controllerStorage = VoiceController { [weak self] name, body in
          self?.sendEvent(name, body)
        }
      }
    }

    AsyncFunction("getAvailability") { () async -> [String: Any?] in
      if let early = VoiceAvailability.preflight() { return early.asDictionary }
      guard #available(iOS 26.0, *) else {
        return VoiceAvailabilityResult(status: "unsupported_os", detail: nil).asDictionary
      }
      return await VoiceAvailability.check().asDictionary
    }

    AsyncFunction("requestPermissions") { () async -> [String: Any?] in
      await VoiceAvailability.requestPermissions()
    }

    // Investigation only (VOICE-M1 debug screen). Not used by product code.
    AsyncFunction("installModel") { () async -> String in
      guard #available(iOS 26.0, *) else { return "unsupported" }
      return await VoiceAvailability.installModel()
    }

    AsyncFunction("start") { (options: PosVoiceStartOptions) async throws in
      guard #available(iOS 26.0, *), let controller = self.controllerStorage as? VoiceController
      else { throw VoiceException("unsupported_os") }
      guard options.locale == VoiceAvailability.localeIdentifier,
        options.maxDurationMs > 0, options.silenceTimeoutMs > 0
      else { throw VoiceException("invalid_options") }
      let config = VoiceStartConfig(
        maxDurationMs: options.maxDurationMs,
        silenceTimeoutMs: options.silenceTimeoutMs,
        contextualStrings: options.contextualStrings ?? [])
      try await controller.start(config: config)
    }

    AsyncFunction("stop") { () async in
      guard #available(iOS 26.0, *), let controller = self.controllerStorage as? VoiceController
      else { return }
      await controller.stop()
    }

    AsyncFunction("cancel") { () async in
      guard #available(iOS 26.0, *), let controller = self.controllerStorage as? VoiceController
      else { return }
      await controller.cancel()
    }

    OnAppEntersBackground {
      guard #available(iOS 26.0, *), let controller = self.controllerStorage as? VoiceController
      else { return }
      Task { await controller.handleBackground() }
    }

    OnDestroy {
      guard #available(iOS 26.0, *), let controller = self.controllerStorage as? VoiceController
      else { return }
      Task { await controller.cancel() }
    }
  }
}

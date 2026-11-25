import AVFoundation
import ExpoModulesCore
import Speech

/// Coded error surfaced to JS as `error.code`. Codes only; never recognized content.
final class VoiceException: Exception, @unchecked Sendable {
  init(_ code: String) {
    super.init(name: "PosVoiceException", description: code, code: code)
  }
}

struct VoiceAvailabilityResult {
  let status: String
  let detail: String?

  var asDictionary: [String: Any?] {
    var result: [String: Any?] = ["status": status]
    if let detail { result["detail"] = detail }
    return result
  }

  static let available = VoiceAvailabilityResult(status: "available", detail: nil)
}

enum VoiceAvailability {
  static let localeIdentifier = "en-US"

  /// Cheap checks that do not need iOS 26 APIs.
  static func preflight() -> VoiceAvailabilityResult? {
    guard #available(iOS 26.0, *) else {
      return VoiceAvailabilityResult(status: "unsupported_os", detail: "requires_ios_26")
    }
    return nil
  }

  static func microphoneState() -> String {
    guard #available(iOS 17.0, *) else { return "undetermined" }
    switch AVAudioApplication.shared.recordPermission {
    case .granted: return "granted"
    case .denied: return "denied"
    default: return "undetermined"
    }
  }

  /// Speech-recognition *authorization* only. Recognition itself never goes through
  /// SFSpeechRecognizer; this is the only SDK entry point for the speech permission state.
  static func speechState() -> String {
    switch SFSpeechRecognizer.authorizationStatus() {
    case .authorized: return "granted"
    case .denied: return "denied"
    case .restricted: return "restricted"
    default: return "undetermined"
    }
  }

  static func requestPermissions() async -> [String: Any?] {
    guard #available(iOS 26.0, *) else {
      return ["microphone": "undetermined", "speech": "undetermined"]
    }
    if microphoneState() == "undetermined" {
      _ = await AVAudioApplication.requestRecordPermission()
    }
    if speechState() == "undetermined" {
      await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
        SFSpeechRecognizer.requestAuthorization { _ in continuation.resume() }
      }
    }
    return ["microphone": microphoneState(), "speech": speechState()]
  }

  @available(iOS 26.0, *)
  static func resolveLocale() async -> Locale? {
    await DictationTranscriber.supportedLocale(equivalentTo: Locale(identifier: localeIdentifier))
  }

  @available(iOS 26.0, *)
  static func check() async -> VoiceAvailabilityResult {
    guard let locale = await resolveLocale() else {
      return VoiceAvailabilityResult(status: "unsupported_locale", detail: "en_US_not_supported")
    }
    let speech = speechState()
    let microphone = microphoneState()
    if speech == "restricted" {
      return VoiceAvailabilityResult(status: "restricted", detail: "speech")
    }
    if microphone == "denied" {
      return VoiceAvailabilityResult(status: "permission_denied", detail: "microphone")
    }
    if speech == "denied" {
      return VoiceAvailabilityResult(status: "permission_denied", detail: "speech")
    }
    let transcriber = DictationTranscriber(locale: locale, preset: .progressiveShortDictation)
    switch await AssetInventory.status(forModules: [transcriber]) {
    case .installed:
      break
    case .unsupported:
      return VoiceAvailabilityResult(status: "unsupported_locale", detail: "asset_unsupported")
    case .supported:
      return VoiceAvailabilityResult(status: "model_not_installed", detail: "supported")
    case .downloading:
      return VoiceAvailabilityResult(status: "model_not_installed", detail: "downloading")
    @unknown default:
      return VoiceAvailabilityResult(status: "model_not_installed", detail: "unknown_asset_status")
    }
    if microphone != "granted" || speech != "granted" {
      let missing = microphone != "granted" ? "microphone" : "speech"
      return VoiceAvailabilityResult(status: "permission_undetermined", detail: missing)
    }
    return .available
  }

  /// Investigation only. Triggers the OS asset download for the en-US dictation model.
  @available(iOS 26.0, *)
  static func installModel() async -> String {
    guard let locale = await resolveLocale() else { return "unsupported" }
    let transcriber = DictationTranscriber(locale: locale, preset: .progressiveShortDictation)
    do {
      if await AssetInventory.status(forModules: [transcriber]) == .unsupported {
        return "unsupported"
      }
      if let request = try await AssetInventory.assetInstallationRequest(supporting: [transcriber]) {
        try await request.downloadAndInstall()
      }
      return await AssetInventory.status(forModules: [transcriber]) == .installed
        ? "installed" : "failed"
    } catch {
      return "failed"
    }
  }
}

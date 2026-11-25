package expo.modules.posvoice

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Android stub (VOICE-M1): always unsupported. No speech or microphone code on Android.
 */
class PosVoiceModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PosVoice")

    Events("onStateChange", "onPartial", "onFinal", "onEnd")

    AsyncFunction("getAvailability") {
      mapOf("status" to "unsupported_platform")
    }

    AsyncFunction("requestPermissions") {
      mapOf("microphone" to "undetermined", "speech" to "undetermined")
    }

    AsyncFunction("installModel") { "unsupported" }

    AsyncFunction("start") { _: Map<String, Any?> ->
      throw CodedException("unsupported_platform", "Voice entry is not supported on Android.", null)
    }

    AsyncFunction("stop") { }
    AsyncFunction("cancel") { }
  }
}

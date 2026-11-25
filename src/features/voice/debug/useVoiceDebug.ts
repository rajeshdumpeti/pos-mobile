import { useCallback, useEffect, useRef, useState } from 'react';

import * as voice from '../native';
import type {
  VoiceAvailability,
  VoiceEndEvent,
  VoiceModelInstallResult,
  VoicePermissions,
  VoiceState,
} from '../native';

export type VoiceDebugTimings = {
  /** Start tap -> state `listening`, ms. */
  startToListeningMs: number | null;
  /** Last partial -> final text, ms. */
  lastPartialToFinalMs: number | null;
};

const startOptions = { locale: 'en-US', maxDurationMs: 30_000, silenceTimeoutMs: 1_500 } as const;

/** Debug-only state holder. Recognized text lives in component state and on screen only. */
export function useVoiceDebug() {
  const [availability, setAvailability] = useState<VoiceAvailability | null>(null);
  const [permissions, setPermissions] = useState<VoicePermissions | null>(null);
  const [installResult, setInstallResult] = useState<VoiceModelInstallResult | 'running' | null>(
    null,
  );
  const [state, setState] = useState<VoiceState>('idle');
  const [partial, setPartial] = useState('');
  const [finalText, setFinalText] = useState('');
  const [end, setEnd] = useState<VoiceEndEvent | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [timings, setTimings] = useState<VoiceDebugTimings>({
    startToListeningMs: null,
    lastPartialToFinalMs: null,
  });
  const startTapAt = useRef<number | null>(null);
  const lastPartialAt = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    setAvailability(await voice.getAvailability());
  }, []);

  useEffect(() => {
    void refresh();
    const subs = [
      voice.onStateChange(({ state: next }) => {
        setState(next);
        if (next === 'listening' && startTapAt.current !== null) {
          const elapsed = Math.round(Date.now() - startTapAt.current);
          setTimings((t) => ({ ...t, startToListeningMs: elapsed }));
        }
      }),
      voice.onPartial(({ text }) => {
        lastPartialAt.current = Date.now();
        setPartial(text);
      }),
      voice.onFinal(({ text }) => {
        setFinalText(text);
        if (lastPartialAt.current !== null) {
          const elapsed = Math.round(Date.now() - lastPartialAt.current);
          setTimings((t) => ({ ...t, lastPartialToFinalMs: elapsed }));
        }
      }),
      voice.onEnd((event) => {
        setEnd(event);
        void refresh();
      }),
    ];
    return () => {
      subs.forEach((s) => s.remove());
      void voice.cancel();
    };
  }, [refresh]);

  const requestPermissions = useCallback(async () => {
    setPermissions(await voice.requestPermissions());
    await refresh();
  }, [refresh]);

  const installModel = useCallback(async () => {
    setInstallResult('running');
    setInstallResult(await voice.installModel());
    await refresh();
  }, [refresh]);

  const start = useCallback(async () => {
    setPartial('');
    setFinalText('');
    setEnd(null);
    setStartError(null);
    setTimings({ startToListeningMs: null, lastPartialToFinalMs: null });
    lastPartialAt.current = null;
    startTapAt.current = Date.now();
    try {
      await voice.start({ ...startOptions });
    } catch (error) {
      const code = (error as { code?: unknown } | null)?.code;
      setStartError(typeof code === 'string' ? code : 'unknown');
    }
  }, []);

  const stop = useCallback(() => voice.stop(), []);
  const cancel = useCallback(() => voice.cancel(), []);

  return {
    availability,
    permissions,
    installResult,
    state,
    partial,
    finalText,
    end,
    startError,
    timings,
    refresh,
    requestPermissions,
    installModel,
    start,
    stop,
    cancel,
  };
}

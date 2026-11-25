import { Redirect } from 'expo-router';
import React from 'react';

import { AppText, Button, Card, Screen, Stack } from '@/design-system/components';
import { routes } from '@/navigation/routes';

import { useVoiceDebug } from './useVoiceDebug';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <AppText variant="caption" color="secondary">
      {label}: {value}
    </AppText>
  );
}

function VoiceDebugPanel() {
  const d = useVoiceDebug();
  const active = d.state === 'starting' || d.state === 'listening' || d.state === 'finishing';
  const ms = (v: number | null) => (v === null ? '-' : `${v} ms`);

  return (
    <Screen testID="voice-debug-screen">
      <AppText variant="title">Voice debug (dev only)</AppText>

      <Card>
        <Stack gap="xs">
          <Row label="Availability" value={d.availability ? d.availability.status : 'checking'} />
          <Row label="Detail" value={d.availability?.detail ?? '-'} />
          <Row label="Microphone" value={d.permissions?.microphone ?? 'not requested'} />
          <Row label="Speech" value={d.permissions?.speech ?? 'not requested'} />
          <Row label="Model install" value={d.installResult ?? '-'} />
        </Stack>
      </Card>

      <Stack gap="sm">
        <Button label="Refresh availability" variant="secondary" onPress={d.refresh} />
        <Button label="Request permissions" variant="secondary" onPress={d.requestPermissions} />
        <Button
          label="Install model (investigation)"
          variant="secondary"
          loading={d.installResult === 'running'}
          onPress={d.installModel}
        />
        <Button label="Start" disabled={active} onPress={d.start} />
        <Button label="Stop" variant="secondary" disabled={!active} onPress={d.stop} />
        <Button label="Cancel" variant="ghost" disabled={!active} onPress={d.cancel} />
      </Stack>

      <Card>
        <Stack gap="xs">
          <Row label="State" value={d.state} />
          <Row label="Start error" value={d.startError ?? '-'} />
          <Row label="End reason" value={d.end?.reason ?? '-'} />
          <Row label="End code" value={d.end?.code ?? '-'} />
          <Row label="Start → listening" value={ms(d.timings.startToListeningMs)} />
          <Row label="Last partial → final" value={ms(d.timings.lastPartialToFinalMs)} />
        </Stack>
      </Card>

      <Card>
        <Stack gap="xs">
          <AppText variant="label">Partial</AppText>
          <AppText testID="voice-debug-partial">{d.partial || '-'}</AppText>
          <AppText variant="label">Final</AppText>
          <AppText testID="voice-debug-final">{d.finalText || '-'}</AppText>
        </Stack>
      </Card>
    </Screen>
  );
}

/** Hidden developer screen. Renders only in __DEV__; otherwise sends the user to Today. */
export function VoiceDebugScreen() {
  if (!__DEV__) return <Redirect href={routes.app.index} />;
  return <VoiceDebugPanel />;
}

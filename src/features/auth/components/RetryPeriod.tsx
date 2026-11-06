import { AppText, Card, Stack } from '@/design-system';

export function RetryPeriod() {
  return (
    <Card>
      <Stack align="center" gap="xs">
        <AppText variant="label">Retry period</AppText>
        <AppText accessibilityLabel="Retry time unavailable" variant="title" color="accent">
          — : —
        </AppText>
        <AppText variant="caption" color="secondary">
          Please wait before trying again.
        </AppText>
      </Stack>
    </Card>
  );
}

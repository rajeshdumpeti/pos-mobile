import { AppText, Card, Stack } from '@/design-system';

export function LegalBoundary() {
  return (
    <Card>
      <Stack gap="xs">
        <AppText variant="label">Before you create an account</AppText>
        <AppText variant="caption" color="secondary">
          Terms and Privacy information will be available for review before registration opens. No
          consent is collected here.
        </AppText>
      </Stack>
    </Card>
  );
}

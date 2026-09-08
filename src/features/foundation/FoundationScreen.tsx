import { AppText, Card, Screen, Stack } from '@/design-system';

export function FoundationScreen() {
  return (
    <Screen scroll={false} testID="foundation-screen">
      <Stack justify="center" style={{ flex: 1 }}>
        <Card>
          <Stack gap="sm" padding="xl">
            <AppText variant="heading" accessibilityRole="header">
              POS foundation
            </AppText>
            <AppText color="secondary">
              The obsolete demo interface has been removed. Approved product screens will be added
              through the POS roadmap.
            </AppText>
          </Stack>
        </Card>
      </Stack>
    </Screen>
  );
}

import { AppText, Button, Card, Screen, Stack } from '@/design-system';

export function FoundationScreen({
  onLogout,
  loggingOut = false,
}: {
  onLogout?: () => void;
  loggingOut?: boolean;
}) {
  return (
    <Screen scroll={false} testID="foundation-screen">
      <Stack justify="center" style={{ flex: 1 }}>
        <Card>
          <Stack gap="sm" padding="xl">
            <AppText variant="heading" accessibilityRole="header">
              POS foundation
            </AppText>
            {onLogout ? (
              <Button
                label="Log Out"
                onPress={onLogout}
                loading={loggingOut}
                disabled={loggingOut}
              />
            ) : null}
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

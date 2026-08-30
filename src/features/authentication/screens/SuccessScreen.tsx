import React from 'react';

import { AppText, Button, Card, Stack } from '@/design-system';
import { AuthIllustration, AuthScaffold } from '@/features/authentication/components';

export function SuccessScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <AuthScaffold
      title="You’re Ready"
      subtitle="Your local POS authentication preview is complete."
      illustration={<AuthIllustration kind="success" accessibilityLabel="POS setup complete" />}
    >
      <Card variant="elevated">
        <Stack gap="lg">
          <AppText color="secondary" style={{ textAlign: 'center' }}>
            No account or session was created. Continue to the existing POS shell.
          </AppText>
          <Button label="Continue to POS" onPress={onContinue} />
        </Stack>
      </Card>
    </AuthScaffold>
  );
}

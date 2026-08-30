import React from 'react';

import { AppText, Stack } from '@/design-system';

import { AuthSheet } from './AuthSheet';

export type AuthDemoProvider = 'Apple' | 'Google';

export function AuthProviderDemoSheet({
  provider,
  onDismiss,
  onContinue,
}: {
  provider: AuthDemoProvider | null;
  onDismiss: () => void;
  onContinue: () => void;
}) {
  return (
    <AuthSheet
      visible={provider !== null}
      title={`${provider ?? 'Provider'} sign-in preview`}
      actionLabel="Continue Local Preview"
      onDismiss={onDismiss}
      onAction={onContinue}
    >
      <Stack gap="sm">
        <AppText accessibilityRole="alert">
          This is a local demonstration only. No provider sign-in occurred.
        </AppText>
        <AppText color="secondary">
          POS did not contact {provider ?? 'an identity provider'}, create an account, or start a
          session. Continue only to preview the next screen.
        </AppText>
      </Stack>
    </AuthSheet>
  );
}

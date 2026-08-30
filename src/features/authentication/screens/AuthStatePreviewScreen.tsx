import React from 'react';

import { AppText, Card, Stack } from '@/design-system';
import { AuthScaffold, AuthStatusSurface } from '@/features/authentication/components';
import {
  AuthPresentationState,
  authRoutes,
} from '@/features/authentication/constants/authentication';

import { AuthScreenNavigation } from './types';

const states: AuthPresentationState[] = [
  'signingIn',
  'offline',
  'invalidCredentials',
  'emailNotVerified',
  'accountLocked',
  'tooManyAttempts',
  'passwordUpdated',
  'passwordResetSent',
  'biometricPermissionDenied',
];

export function AuthStatePreviewScreen({ onNavigate, onBack }: AuthScreenNavigation) {
  return (
    <AuthScaffold
      title="Authentication States"
      subtitle="Development-only local presentation preview."
      onBack={onBack}
    >
      <Card>
        <AppText color="muted" variant="caption">
          These surfaces are explicit and removable when real authentication is introduced.
        </AppText>
      </Card>
      <Stack gap="sm">
        {states.map((state) => (
          <AuthStatusSurface
            key={state}
            state={state}
            onAction={() =>
              onNavigate(
                state === 'biometricPermissionDenied'
                  ? authRoutes.success
                  : state === 'emailNotVerified'
                    ? authRoutes.verifyEmail
                    : authRoutes.signIn,
              )
            }
          />
        ))}
      </Stack>
    </AuthScaffold>
  );
}

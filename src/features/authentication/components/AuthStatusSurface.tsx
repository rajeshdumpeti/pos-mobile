import React from 'react';

import { AppText, Button, Card, LoadingIndicator, Stack } from '@/design-system';
import { POSIcon, POSIconName } from '@/design-system/icons';
import { useTheme } from '@/design-system/theme';

import {
  AuthPresentationState,
  authStateContent,
} from '@/features/authentication/constants/authentication';

const stateIcons: Record<AuthPresentationState, POSIconName> = {
  signingIn: 'shield',
  offline: 'alert',
  invalidCredentials: 'error',
  emailNotVerified: 'email',
  accountLocked: 'lock',
  tooManyAttempts: 'alert',
  passwordUpdated: 'check',
  passwordResetSent: 'email',
  biometricPermissionDenied: 'fingerprint',
};

export function AuthStatusSurface({
  state,
  onAction,
  actionLabel,
}: {
  state: AuthPresentationState;
  onAction: () => void;
  actionLabel?: string;
}) {
  const theme = useTheme();
  const content = authStateContent[state];
  const isSuccess = state === 'passwordUpdated' || state === 'passwordResetSent';
  const isInfo = state === 'signingIn' || state === 'emailNotVerified';
  const backgroundColor = isSuccess
    ? theme.colors.successSoft
    : isInfo
      ? theme.colors.infoSoft
      : theme.colors.dangerSoft;
  const iconColor = isSuccess
    ? theme.colors.success
    : isInfo
      ? theme.colors.info
      : theme.colors.danger;

  return (
    <Card style={{ backgroundColor }}>
      <Stack gap="sm">
        <Stack
          accessible
          accessibilityRole="alert"
          accessibilityLabel={`${content.title}. ${content.message}`}
          gap="sm"
        >
          {state === 'signingIn' ? (
            <LoadingIndicator label={content.title} />
          ) : (
            <Stack direction="horizontal" gap="sm" align="center">
              <POSIcon name={stateIcons[state]} color={iconColor} size={24} />
              <AppText variant="title" style={{ flex: 1 }}>
                {content.title}
              </AppText>
            </Stack>
          )}
          <AppText color="secondary">{content.message}</AppText>
        </Stack>
        <Button variant="secondary" label={actionLabel ?? content.actionLabel} onPress={onAction} />
      </Stack>
    </Card>
  );
}

import React from 'react';

import { Button, Stack } from '@/design-system';
import { AuthRoutePath, authRouteLinks } from '@/features/authentication/constants/authentication';

import { AuthSheet } from './AuthSheet';

export function AuthQuickAccessSheet({
  visible,
  onDismiss,
  onNavigate,
}: {
  visible: boolean;
  onDismiss: () => void;
  onNavigate: (path: AuthRoutePath) => void;
}) {
  return (
    <AuthSheet visible={visible} title="Authentication quick access" onDismiss={onDismiss}>
      <Stack gap="xs">
        {authRouteLinks.map((route) => (
          <Button
            key={route.path}
            variant="secondary"
            label={route.label}
            onPress={() => {
              onDismiss();
              onNavigate(route.path);
            }}
          />
        ))}
      </Stack>
    </AuthSheet>
  );
}

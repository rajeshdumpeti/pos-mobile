import React from 'react';
import { POSIcon } from '@/design-system/icons';
import { AppText } from './AppText';
import { Button } from './Button';
import { Stack } from './Stack';
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Stack accessible accessibilityRole="alert" align="center" gap="sm" padding="xl">
      <POSIcon name="error" size={28} tone="danger" />
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      <AppText color="secondary" style={{ textAlign: 'center' }}>
        {message}
      </AppText>
      {onRetry ? <Button variant="secondary" label="Try again" onPress={onRetry} /> : null}
    </Stack>
  );
}

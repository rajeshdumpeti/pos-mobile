import React from 'react';
import { POSIcon, POSIconName } from '@/design-system/icons';
import { AppText } from './AppText';
import { Button } from './Button';
import { Stack } from './Stack';
export function EmptyState({
  title,
  message,
  icon,
  actionLabel,
  onAction,
  className,
}: {
  title: string;
  message: string;
  icon?: POSIconName;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <Stack className={className} align="center" gap="sm" padding="xl">
      {icon ? <POSIcon name={icon} size={28} tone="muted" /> : null}
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      <AppText color="muted" style={{ textAlign: 'center' }}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <Button variant="secondary" label={actionLabel} onPress={onAction} />
      ) : null}
    </Stack>
  );
}

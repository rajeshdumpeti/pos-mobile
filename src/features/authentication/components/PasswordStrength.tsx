import React from 'react';
import { View } from 'react-native';

import { AppText, Stack } from '@/design-system';
import { POSIcon } from '@/design-system/icons';
import { useTheme } from '@/design-system/theme';
import { getPasswordRequirements } from '@/features/authentication/validation/authValidation';

export function PasswordStrength({ password }: { password: string }) {
  const theme = useTheme();
  const requirements = getPasswordRequirements(password);
  const entries = [
    ['minimumLength', '8+ characters'],
    ['uppercase', 'One uppercase character'],
    ['numberOrSymbol', 'One number or symbol'],
  ] as const;
  const completed = entries.filter(([key]) => requirements[key]).length;
  const strengthColor = completed === 3 ? theme.colors.success : theme.colors.warning;

  return (
    <Stack gap="xs">
      <Stack
        direction="horizontal"
        gap="xxs"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        {entries.map(([key]) => (
          <View
            key={key}
            style={{
              flex: 1,
              height: 4,
              borderRadius: theme.radii.pill,
              backgroundColor: requirements[key] ? strengthColor : theme.colors.borderDefault,
            }}
          />
        ))}
      </Stack>
      {entries.map(([key, label]) => (
        <Stack
          key={key}
          direction="horizontal"
          gap="xs"
          align="center"
          accessible
          accessibilityLabel={`${label}, ${requirements[key] ? 'met' : 'missing'}`}
        >
          <POSIcon
            name={requirements[key] ? 'check' : 'close'}
            size={16}
            color={requirements[key] ? theme.colors.success : theme.colors.textMuted}
          />
          <AppText variant="caption" color={requirements[key] ? 'secondary' : 'muted'}>
            {requirements[key] ? 'Met: ' : 'Needs: '}
            {label}
          </AppText>
        </Stack>
      ))}
    </Stack>
  );
}

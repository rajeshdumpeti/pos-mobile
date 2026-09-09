import { View } from 'react-native';
import { AppText, Stack } from '@/design-system';
import { useTheme } from '@/design-system/theme';

// A local length guide, deliberately not a security score or server validation.
export function PasswordProgress({ password }: { password: string }) {
  const theme = useTheme();
  const length = Array.from(password).length;
  const filled = Math.min(4, Math.ceil(length / 6));
  return (
    <Stack gap="xs">
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Password length guide"
        accessibilityValue={{ min: 0, max: 4, now: filled, text: 'Local length guide only' }}
        style={{ flexDirection: 'row', gap: theme.spacing.xxs }}
      >
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={{
              flex: 1,
              height: theme.spacing.xxs,
              borderRadius: theme.radii.pill,
              backgroundColor:
                index < filled ? theme.colors.accentPrimary : theme.colors.borderDefault,
            }}
          />
        ))}
      </View>
      <AppText variant="caption" color="secondary">
        Choose a long, unique password. This length guide does not confirm password acceptance.
      </AppText>
    </Stack>
  );
}

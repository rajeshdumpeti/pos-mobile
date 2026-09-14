import { Pressable, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../theme';

export function Checkbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={{
        minHeight: theme.controlSizes.minimumTouchTarget,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <View
        style={{
          width: theme.spacing.lg,
          height: theme.spacing.lg,
          borderWidth: 2,
          borderRadius: theme.radii.small,
          borderColor: checked ? theme.colors.accentPrimary : theme.colors.borderDefault,
          backgroundColor: checked ? theme.colors.accentPrimary : theme.colors.surfacePrimary,
        }}
      >
        {checked ? (
          <AppText
            color="onAccent"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ textAlign: 'center', lineHeight: theme.spacing.lg - 4 }}
          >
            ✓
          </AppText>
        ) : null}
      </View>
      <AppText>{label}</AppText>
    </Pressable>
  );
}

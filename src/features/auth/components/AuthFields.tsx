import { useState } from 'react';
import { Pressable } from 'react-native';
import { TextInput, TextInputProps } from '@/design-system/components';
import { POSIcon } from '@/design-system/icons';
import { useTheme } from '@/design-system/theme';

export function EmailField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <TextInput
      label="Email"
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
      autoCorrect={false}
      keyboardType="email-address"
      autoComplete="email"
      textContentType="emailAddress"
      secureTextEntry={false}
    />
  );
}

export function PasswordField({ label, ...props }: TextInputProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  return (
    <TextInput
      {...props}
      label={label}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      trailingAccessory={
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel={`${label} visibility`}
          accessibilityHint={visible ? 'Turn off to hide password' : 'Turn on to show password'}
          accessibilityState={{ checked: visible }}
          onPress={() => setVisible((value) => !value)}
          style={({ pressed }) => ({
            minHeight: theme.controlSizes.iconButton,
            minWidth: theme.controlSizes.iconButton,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.radii.pill,
            backgroundColor: pressed ? theme.colors.accentSoft : 'transparent',
          })}
        >
          <POSIcon name={visible ? 'hidePassword' : 'showPassword'} tone="accent" />
        </Pressable>
      }
    />
  );
}

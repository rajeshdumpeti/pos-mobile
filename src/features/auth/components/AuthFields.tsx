import React, { useState } from 'react';
import { Pressable, TextInput as NativeTextInput } from 'react-native';
import { TextInput, TextInputProps } from '@/design-system/components';
import { POSIcon } from '@/design-system/icons';
import { useTheme } from '@/design-system/theme';

type EmailFieldProps = Omit<
  TextInputProps,
  | 'label'
  | 'secureTextEntry'
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'keyboardType'
  | 'autoComplete'
  | 'textContentType'
> & { ref?: React.Ref<NativeTextInput> };

export function EmailField({ ref, ...props }: EmailFieldProps) {
  return (
    <TextInput
      {...props}
      ref={ref}
      label="Email"
      autoCapitalize="none"
      autoCorrect={false}
      keyboardType="email-address"
      autoComplete="email"
      textContentType="emailAddress"
      secureTextEntry={false}
    />
  );
}

export function PasswordField({ label, ref, ...props }: TextInputProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  return (
    <TextInput
      {...props}
      ref={ref}
      label={label}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      trailingAccessory={
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel={`${label} visibility`}
          accessibilityHint={visible ? 'Turn off to hide password' : 'Turn on to show password'}
          accessibilityState={{ checked: visible, disabled: props.editable === false }}
          disabled={props.editable === false}
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

import React, { useState } from 'react';
import { IconButton, Stack, TextInput, TextInputProps } from '@/design-system';

export function PasswordField(props: Omit<TextInputProps, 'secureTextEntry'>) {
  const [visible, setVisible] = useState(false);

  return (
    <Stack gap="xxs">
      <TextInput {...props} secureTextEntry={!visible} style={props.style} />
      <Stack direction="horizontal" justify="flex-end">
        <IconButton
          icon={visible ? 'eyeOff' : 'eye'}
          accessibilityLabel={visible ? `Hide ${props.label}` : `Show ${props.label}`}
          disabled={props.disabled}
          onPress={() => setVisible((value) => !value)}
        />
      </Stack>
    </Stack>
  );
}

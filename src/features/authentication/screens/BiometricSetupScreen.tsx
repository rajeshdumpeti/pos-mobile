import React, { useState } from 'react';
import { Platform } from 'react-native';

import { Button, Card, Stack } from '@/design-system';
import {
  AuthRadioOption,
  AuthIllustration,
  AuthInfoSheet,
  AuthScaffold,
  AuthStatusSurface,
  AuthTextButton,
} from '@/features/authentication/components';
import { authRoutes } from '@/features/authentication/constants/authentication';

import { AuthScreenNavigation } from './types';

export function BiometricSetupScreen({ onNavigate, onBack }: AuthScreenNavigation) {
  const options = Platform.OS === 'ios' ? ['Face ID', 'Touch ID'] : ['Fingerprint'];
  const [selected, setSelected] = useState(options[0]);
  const [denied, setDenied] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  return (
    <AuthScaffold
      title="Faster, Optional Access"
      subtitle="Choose a biometric presentation for this local preview."
      onBack={onBack}
      illustration={
        <AuthIllustration kind="biometric" accessibilityLabel="Optional biometric access" />
      }
    >
      <Card>
        <Stack gap="sm">
          <Stack accessibilityRole="radiogroup" accessibilityLabel="Biometric access options">
            {options.map((option) => (
              <AuthRadioOption
                key={option}
                selected={selected === option}
                label={option}
                onPress={() => {
                  setSelected(option);
                  setDenied(false);
                }}
              />
            ))}
          </Stack>
          {denied ? (
            <AuthStatusSurface
              state="biometricPermissionDenied"
              onAction={() => onNavigate(authRoutes.success)}
            />
          ) : null}
          <Button label="Enable Biometrics" onPress={() => onNavigate(authRoutes.success)} />
          <Button
            variant="secondary"
            label="Maybe Later"
            onPress={() => onNavigate(authRoutes.success)}
          />
          <AuthTextButton label="Preview permission denied" onPress={() => setDenied(true)} />
          <AuthTextButton label="About biometric access" onPress={() => setInfoVisible(true)} />
        </Stack>
      </Card>
      <AuthInfoSheet
        kind="biometricInfo"
        visible={infoVisible}
        onDismiss={() => setInfoVisible(false)}
      />
    </AuthScaffold>
  );
}

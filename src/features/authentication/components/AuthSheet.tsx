import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';

import { AppText, Button, IconButton, Stack } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import {
  AuthSheetKind,
  authSheetContent,
} from '@/features/authentication/constants/authentication';

export function AuthSheet({
  visible,
  title,
  onDismiss,
  actionLabel,
  onAction,
  children,
}: React.PropsWithChildren<{
  visible: boolean;
  title: string;
  onDismiss: () => void;
  actionLabel?: string;
  onAction?: () => void;
}>) {
  const theme = useTheme();
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss sheet"
          onPress={onDismiss}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: theme.colors.textPrimary,
            opacity: theme.opacity.disabled,
          }}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            accessibilityViewIsModal
            style={{
              backgroundColor: theme.colors.surfacePrimary,
              borderTopLeftRadius: theme.radii.large,
              borderTopRightRadius: theme.radii.large,
              padding: theme.spacing.xl,
              paddingBottom: theme.spacing.xxxl,
              borderColor: theme.colors.borderDefault,
              borderWidth: 1,
            }}
          >
            <Stack gap="lg" style={{ width: '100%', maxWidth: 520, alignSelf: 'center' }}>
              <Stack direction="horizontal" align="center" justify="space-between">
                <AppText variant="title" accessibilityRole="header" style={{ flex: 1 }}>
                  {title}
                </AppText>
                <IconButton icon="close" accessibilityLabel="Close sheet" onPress={onDismiss} />
              </Stack>
              {children}
              {actionLabel && onAction ? (
                <Button
                  label={actionLabel}
                  onPress={() => {
                    onDismiss();
                    onAction();
                  }}
                />
              ) : null}
            </Stack>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function AuthInfoSheet({
  kind,
  visible,
  onDismiss,
  onAction,
}: {
  kind: AuthSheetKind;
  visible: boolean;
  onDismiss: () => void;
  onAction?: () => void;
}) {
  const content = authSheetContent[kind];
  return (
    <AuthSheet
      visible={visible}
      title={content.title}
      onDismiss={onDismiss}
      actionLabel={content.actionLabel}
      onAction={onAction}
    >
      <AppText color="secondary">{content.body}</AppText>
    </AuthSheet>
  );
}

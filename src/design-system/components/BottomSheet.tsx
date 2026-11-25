import React, { useEffect, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/design-system/theme';

export type BottomSheetProps = {
  visible: boolean;
  /** Spoken name of the sheet. */
  accessibilityLabel: string;
  /** Hardware back and an optional backdrop tap. Omit to make the sheet non-dismissible. */
  onRequestClose?: () => void;
  dismissOnBackdrop?: boolean;
  children: ReactNode;
  testID?: string;
};

/**
 * A modal sheet anchored to the bottom edge. Built on React Native's Modal and the design
 * tokens only. The slide animation is replaced by a fade when Reduce Motion is on.
 */
export function BottomSheet({
  visible,
  accessibilityLabel,
  onRequestClose,
  dismissOnBackdrop = false,
  children,
  testID,
}: BottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduceMotion(value);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'fade' : 'slide'}
      onRequestClose={onRequestClose}
      accessibilityViewIsModal
      statusBarTranslucent
      testID={testID}
    >
      <View style={styles.root}>
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          disabled={!dismissOnBackdrop || !onRequestClose}
          onPress={onRequestClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.modalScrim }]}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            accessibilityViewIsModal
            accessibilityLabel={accessibilityLabel}
            style={{
              maxHeight: '92%',
              backgroundColor: theme.colors.surfacePrimary,
              borderTopLeftRadius: theme.radii.large,
              borderTopRightRadius: theme.radii.large,
              paddingTop: theme.spacing.md,
              paddingHorizontal: theme.spacing.md,
              paddingBottom: Math.max(insets.bottom, theme.spacing.md),
              ...theme.shadows.elevated,
            }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.xs }}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, justifyContent: 'flex-end' } });

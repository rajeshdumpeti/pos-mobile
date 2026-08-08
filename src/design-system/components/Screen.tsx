import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/design-system/theme';

export type ScreenProps = React.PropsWithChildren<{
  className?: string;
  scroll?: boolean;
  keyboardSafe?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  testID?: string;
}>;
export function Screen({
  children,
  className,
  scroll = true,
  keyboardSafe = false,
  contentContainerStyle,
  testID,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const content = [
    styles.content,
    {
      paddingTop: insets.top + theme.spacing.sm,
      paddingBottom: Math.max(insets.bottom, theme.spacing.xl),
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    contentContainerStyle,
  ];
  const body = scroll ? (
    <ScrollView
      className={className}
      testID={testID}
      style={{ backgroundColor: theme.colors.backgroundPrimary }}
      contentContainerStyle={content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={keyboardSafe}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      className={className}
      testID={testID}
      style={[content, { flex: 1, backgroundColor: theme.colors.backgroundPrimary }]}
    >
      {children}
    </View>
  );
  return keyboardSafe ? (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );
}
const styles = StyleSheet.create({ fill: { flex: 1 }, content: { minHeight: '100%' } });

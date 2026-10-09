import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/design-system/theme';

export type ScreenProps = React.PropsWithChildren<{
  className?: string;
  scroll?: boolean;
  keyboardSafe?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  testID?: string;
  refreshControl?: ScrollViewProps['refreshControl'];
  footer?: React.ReactNode;
  header?: React.ReactNode;
}>;
export function Screen({
  children,
  className,
  scroll = true,
  keyboardSafe = false,
  contentContainerStyle,
  testID,
  refreshControl,
  footer,
  header,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const content = [
    styles.content,
    {
      paddingTop: theme.spacing.sm,
      paddingBottom: footer ? theme.spacing.md : Math.max(insets.bottom, theme.spacing.xl),
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    contentContainerStyle,
  ];
  const body = scroll ? (
    <ScrollView
      className={className}
      testID={testID}
      refreshControl={refreshControl}
      style={{ flex: 1, minHeight: 0, backgroundColor: theme.colors.backgroundPrimary }}
      contentContainerStyle={content}
      keyboardShouldPersistTaps="handled"
      // iOS keyboard padding is owned by KeyboardAvoidingView below.
      automaticallyAdjustKeyboardInsets={false}
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
  const screen = keyboardSafe ? (
    <KeyboardAvoidingView
      collapsable={false}
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {header}
      {body}
      {footer && (
        <View
          style={{
            flexShrink: 0,
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.sm,
            paddingBottom: Math.max(insets.bottom, theme.spacing.md),
            backgroundColor: theme.colors.backgroundPrimary,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.divider,
          }}
        >
          {footer}
        </View>
      )}
    </KeyboardAvoidingView>
  ) : (
    <View style={styles.fill}>
      {header}
      {body}
    </View>
  );
  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: theme.colors.backgroundPrimary }}
    >
      {screen}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ fill: { flex: 1 }, content: { flexGrow: 1 } });

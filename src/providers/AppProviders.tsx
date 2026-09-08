import { QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { ThemeProvider, ThemePreference } from '@/design-system/theme';
import { createQueryClient } from '@/lib/query/queryClient';

export function AppProviders({
  children,
  themePreference,
}: React.PropsWithChildren<{ themePreference?: ThemePreference }>) {
  const [queryClient] = useState(createQueryClient);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider preference={themePreference}>
          <AppErrorBoundary>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
          </AppErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });

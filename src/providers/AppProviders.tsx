import { QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { ThemeProvider, ThemePreference } from '@/design-system/theme';
import { createQueryClient } from '@/lib/query/queryClient';
import { AppProvider } from '@/store/AppStore';

export function AppProviders({
  children,
  themePreference = 'system',
}: React.PropsWithChildren<{ themePreference?: ThemePreference }>) {
  const [queryClient] = useState(createQueryClient);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <ThemeProvider preference={themePreference}>
            <QueryClientProvider client={queryClient}>
              <AppProvider>{children}</AppProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });

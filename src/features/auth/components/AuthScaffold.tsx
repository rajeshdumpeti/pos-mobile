import { PropsWithChildren, ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { AppText, IconButton, Screen, Stack } from '@/design-system';
import { IllustrationFrame, IllustrationRole } from '@/design-system/illustrations';
import { useTheme } from '@/design-system/theme';
import { routes } from '@/navigation/routes';
import type { SafeFallbackRoute } from '@/navigation/routes';
import { useSafeNavigation } from '@/navigation/useSafeNavigation';
import { AuthEntrance } from './AuthEntrance';

export function AuthScaffold({
  title,
  subtitle,
  illustration,
  welcome = false,
  modal = false,
  children,
  footer,
  backFallback,
  onBack,
}: PropsWithChildren<{
  title: string;
  subtitle: string;
  illustration?: IllustrationRole;
  welcome?: boolean;
  modal?: boolean;
  footer?: ReactNode;
  backFallback?: SafeFallbackRoute;
  onBack?: () => void;
}>) {
  const theme = useTheme();
  const { backOrReplace, dismissOrReplace } = useSafeNavigation();
  const { width } = useWindowDimensions();
  // Cap reading width on tablets; shrink artwork before it can crowd narrow phones.
  const contentWidth = Math.min(width - theme.spacing.xl * 2, theme.spacing.huge * 10);
  const artSize = Math.max(
    theme.spacing.huge,
    Math.min(contentWidth - theme.spacing.xl * 2, theme.spacing.huge * (welcome ? 6 : 4)),
  );
  return (
    <Screen keyboardSafe testID="auth-scaffold" contentContainerStyle={{ flexGrow: 1 }}>
      <View
        style={{
          width: '100%',
          maxWidth: theme.spacing.huge * 10,
          alignSelf: 'center',
          flexGrow: 1,
          gap: theme.spacing.xl,
        }}
      >
        {!welcome && (
          <View style={{ alignSelf: 'flex-start' }}>
            <IconButton
              icon={modal ? 'close' : 'back'}
              accessibilityLabel={modal ? 'Close' : 'Back'}
              onPress={() => {
                onBack?.();
                const fallback = backFallback ?? (modal ? routes.auth.signIn : routes.auth.welcome);
                if (modal) {
                  dismissOrReplace(fallback);
                } else {
                  backOrReplace(fallback);
                }
              }}
            />
          </View>
        )}
        <AuthEntrance>
          <Stack gap="xl">
            {welcome && (
              <AppText variant="caption" color="accent" style={{ textAlign: 'center' }}>
                PERSONAL OPERATING SYSTEM
              </AppText>
            )}
            {illustration && (
              <AuthEntrance artwork>
                <IllustrationFrame
                  role={illustration}
                  decorative
                  size={artSize}
                  testID={`auth-illustration-${illustration}`}
                />
              </AuthEntrance>
            )}
            <Stack gap="sm">
              <AppText
                accessibilityRole="header"
                variant={welcome ? 'display' : 'heading'}
                style={{ textAlign: illustration ? 'center' : 'left' }}
              >
                {title}
              </AppText>
              <AppText color="secondary" style={{ textAlign: illustration ? 'center' : 'left' }}>
                {subtitle}
              </AppText>
            </Stack>
            {children}
          </Stack>
        </AuthEntrance>
        {footer && (
          <View
            testID="auth-footer"
            style={{ marginTop: 'auto', paddingTop: theme.spacing.xl, gap: theme.spacing.sm }}
          >
            {footer}
          </View>
        )}
      </View>
    </Screen>
  );
}

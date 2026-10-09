import type { ReactNode } from 'react';
import { View } from 'react-native';
import { AppText, Button, Screen } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { routes, useSafeNavigation } from '@/navigation';
import type { PlanningFailure } from './failure';
export function PlanItemPage({
  title,
  busy = false,
  children,
  footer,
}: {
  title: string;
  busy?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const theme = useTheme(),
    navigation = useSafeNavigation();
  return (
    <Screen
      keyboardSafe
      header={
        <View
          collapsable={false}
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.sm,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.xs,
              padding: theme.spacing.xs,
              borderRadius: theme.radii.large,
              backgroundColor: theme.colors.backgroundPrimary,
            }}
          >
            <Button
              label="Back"
              leadingIcon="back"
              variant="ghost"
              accessibilityLabel={`Back from ${title}`}
              disabled={busy}
              onPress={() => navigation.backOrReplace(routes.app.index)}
            />
            <AppText
              variant="title"
              accessibilityRole="header"
              style={{ flex: 1, textAlign: 'center' }}
            >
              {title}
            </AppText>
          </View>
        </View>
      }
      footer={footer}
      contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.xl }}
    >
      {children}
    </Screen>
  );
}
export function FailureNotice({ failure }: { failure: PlanningFailure | undefined }) {
  if (!failure) return null;
  return (
    <View accessibilityLiveRegion="assertive">
      <AppText accessibilityRole="alert" color="danger">
        {failure.message}
      </AppText>
      {failure.retryAfterSeconds && (
        <AppText color="secondary">
          Wait at least {failure.retryAfterSeconds} seconds before retrying.
        </AppText>
      )}
      {failure.requestId && (
        <AppText color="muted" variant="caption">
          Support ID: {failure.requestId}
        </AppText>
      )}
    </View>
  );
}

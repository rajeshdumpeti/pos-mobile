import { Pressable, View } from 'react-native';
import { AppText, IconButton } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useSession } from '@/features/auth/session';
import { routes } from '@/navigation';
import { useShellDestination } from './useShellDestination';
export function displayInitials(name?: string) {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return words.length
    ? [words[0], ...(words.length > 1 ? [words[words.length - 1]] : [])]
        .map((word) => Array.from(word ?? '')[0] ?? '')
        .join('')
        .toLocaleUpperCase()
    : 'POS';
}
export function greeting(date: Date) {
  return date.getHours() < 12
    ? 'Good morning'
    : date.getHours() < 18
      ? 'Good afternoon'
      : 'Good evening';
}
export function ShellHeader({ title }: { title: string }) {
  const theme = useTheme(),
    open = useShellDestination(),
    session = useSession();
  const name = session.status === 'signedIn' ? session.account.displayName : undefined;
  const now = new Date();
  return (
    <View
      testID="shell-header"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        backgroundColor: theme.colors.surfacePrimary,
        borderRadius: theme.radii.large,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xs,
        marginHorizontal: 0,
        borderWidth: 0,
        borderColor: theme.colors.borderDefault,
      }}
    >
      <View style={{ flex: 1, gap: theme.spacing.xxs }}>
        <AppText variant="heading" accessibilityRole="header">
          {title === 'Today' ? `${greeting(now)}${name?.trim() ? `, ${name.trim()}` : ''}` : title}
        </AppText>
        {title === 'Today' && (
          <AppText color="secondary">
            {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </AppText>
        )}
      </View>
      <IconButton
        style={{
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.backgroundSecondary,
        }}
        icon="notifications"
        accessibilityLabel="Open Notifications"
        onPress={() => open(routes.app.notifications)}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Profile"
        onPress={() => open(routes.app.profile)}
        style={{
          minHeight: theme.accessibility.minimumTouchTarget,
          minWidth: theme.accessibility.minimumTouchTarget,
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.backgroundSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppText variant="label" color="accent">
          {displayInitials(name)}
        </AppText>
      </Pressable>
    </View>
  );
}

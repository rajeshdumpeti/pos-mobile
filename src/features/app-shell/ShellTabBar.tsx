import { Pressable, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/design-system';
import { POSIcon, type POSIconName } from '@/design-system/icons';
import { useTheme } from '@/design-system/theme';
import { routes } from '@/navigation';
import { useShellDestination } from './useShellDestination';
const icons: Record<string, POSIconName> = {
  index: 'today',
  plan: 'calendar',
  focus: 'focus',
  review: 'review',
};
export function ShellTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme(),
    insets = useSafeAreaInsets(),
    open = useShellDestination();
  return (
    <View
      style={{
        backgroundColor: theme.colors.backgroundPrimary,
        paddingBottom: Math.max(insets.bottom, theme.spacing.xs),
        paddingHorizontal: theme.spacing.sm,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: theme.spacing.xs,
          borderRadius: theme.radii.large,
          backgroundColor: theme.colors.surfacePrimary,
          ...theme.shadows.card,
        }}
      >
        {state.routes.flatMap((route, index) => {
          const selected = index === state.index;
          const tab = (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={descriptors[route.key]?.options.title ?? route.name}
              accessibilityState={{ selected }}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!selected && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={{
                flex: 1,
                minHeight: theme.controlSizes.buttonHeight,
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing.xxs,
                borderRadius: theme.radii.pill,
                backgroundColor: selected ? theme.colors.accentSelected : 'transparent',
              }}
            >
              <POSIcon
                name={icons[route.name] ?? 'today'}
                tone={selected ? 'accent' : 'secondary'}
              />
              <AppText variant="caption" color={selected ? 'accent' : 'secondary'}>
                {descriptors[route.key]?.options.title ?? route.name}
              </AppText>
            </Pressable>
          );
          return index === 1
            ? [
                tab,
                <Pressable
                  key="add"
                  accessibilityRole="button"
                  accessibilityLabel="Open Quick Log"
                  onPress={() => open(routes.app.quickLog)}
                  style={{
                    backgroundColor: theme.colors.accentPrimary,
                    marginHorizontal: theme.spacing.xs,
                    width: theme.controlSizes.iconButton,
                    height: theme.controlSizes.iconButton,
                    minWidth: theme.accessibility.minimumTouchTarget,
                    flexShrink: 0,
                    borderRadius: theme.radii.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <POSIcon
                    testID="shell-add-icon"
                    name="add"
                    size={28}
                    color={theme.colors.onAccent}
                  />
                </Pressable>,
              ]
            : [tab];
        })}
      </View>
    </View>
  );
}

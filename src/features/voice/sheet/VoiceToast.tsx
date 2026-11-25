import { useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { PlanningButton as Button } from '@/features/today/TodayVisuals';
import { voiceCopy } from '../copy';

export type VoiceToastValue = { message: string; itemId?: string };

/** A short, plain confirmation shown only after the server has confirmed the result. */
export function VoiceToast({
  toast,
  onView,
  onDismiss,
}: {
  toast: VoiceToastValue | null;
  onView: (itemId: string) => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);
  if (!toast) return null;
  const { itemId } = toast;
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: theme.spacing.md,
        right: theme.spacing.md,
        bottom: Math.max(insets.bottom, theme.spacing.md) + theme.spacing.xxxl,
      }}
    >
      <View
        accessibilityLiveRegion="polite"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          padding: theme.spacing.md,
          borderRadius: theme.radii.medium,
          backgroundColor: theme.colors.surfaceElevated,
          ...theme.shadows.elevated,
        }}
      >
        <View style={{ flex: 1 }}>
          <AppText>{toast.message}</AppText>
        </View>
        {itemId && <Button label={voiceCopy.view} variant="ghost" onPress={() => onView(itemId)} />}
      </View>
    </View>
  );
}

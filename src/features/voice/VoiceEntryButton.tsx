import { IconButton } from '@/design-system';
import { PlanningButton as Button } from '@/features/today/TodayVisuals';
import { localDate, resolveTimeZone } from '@/features/today/time';
import { useVoiceAvailability } from './availability';
import { voiceCopy } from './copy';
import type { VoiceEntryPoint } from './session/types';
import { useVoiceEntry } from './VoiceEntryProvider';

/**
 * The mic. Rendered only when voice is available (build flag, server flag, iOS, on-device
 * speech); otherwise nothing at all. `contextDate` is the selected date on Plan; elsewhere it
 * defaults to today in the device timezone.
 */
export function VoiceEntryButton({
  entry,
  contextDate,
  kind = 'icon',
}: {
  entry: VoiceEntryPoint;
  contextDate?: string;
  kind?: 'icon' | 'labeled';
}) {
  const availability = useVoiceAvailability();
  const voice = useVoiceEntry();
  if (!availability.enabled || !voice) return null;
  const onPress = () => {
    const zone = resolveTimeZone();
    const date = contextDate ?? (zone ? localDate(new Date(), zone) : undefined);
    if (date) voice.open(entry, date);
  };
  return kind === 'labeled' ? (
    <Button label={voiceCopy.micLabel} leadingIcon="mic" variant="secondary" onPress={onPress} />
  ) : (
    <IconButton icon="mic" accessibilityLabel={voiceCopy.micLabel} onPress={onPress} />
  );
}

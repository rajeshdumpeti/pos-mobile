import { View } from 'react-native';

import { useTheme } from '@/design-system/theme';

import { resolveIllustration } from './illustrationRegistry';
import type { IllustrationFrameProps } from './types';

export function IllustrationFrame({
  role,
  size,
  decorative = false,
  accessibilityLabel,
  testID,
}: IllustrationFrameProps) {
  const theme = useTheme();
  const { Artwork } = resolveIllustration(role);
  const artworkSize =
    size !== undefined && Number.isFinite(size) && size > 0 ? size : theme.spacing.huge;
  const label = accessibilityLabel?.trim();
  const meaningful = !decorative && Boolean(label);

  return (
    <View
      testID={testID}
      accessible={meaningful}
      accessibilityRole={meaningful ? 'image' : undefined}
      accessibilityLabel={meaningful ? label : undefined}
      accessibilityElementsHidden={!meaningful}
      importantForAccessibility={meaningful ? 'yes' : 'no-hide-descendants'}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
        borderRadius: theme.radii.large,
        backgroundColor: theme.colors.accentSoft,
      }}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Artwork size={artworkSize} />
      </View>
    </View>
  );
}

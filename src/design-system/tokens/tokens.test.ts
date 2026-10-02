import { createTheme } from '@/design-system/theme';

function luminance(hex: string): number {
  const channelLuminance = (channel: string) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return (
    channelLuminance(hex.slice(1, 3)) * 0.2126 +
    channelLuminance(hex.slice(3, 5)) * 0.7152 +
    channelLuminance(hex.slice(5, 7)) * 0.0722
  );
}

function contrast(a: string, b: string): number {
  const values = [luminance(a), luminance(b)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}

test.each(['light', 'dark'] as const)(
  '%s primary action content and focus treatments meet contrast thresholds',
  (mode) => {
    const { colors } = createTheme(mode);

    for (const action of [colors.accentPrimary, colors.accentPressed]) {
      expect(contrast(colors.onAccent, action)).toBeGreaterThanOrEqual(4.5);
    }

    for (const surface of [
      colors.backgroundPrimary,
      colors.backgroundSecondary,
      colors.surfacePrimary,
      colors.surfaceElevated,
      colors.accentSoft,
      colors.accentSelected,
    ]) {
      expect(contrast(colors.accentPrimary, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.focusRing, surface)).toBeGreaterThanOrEqual(3);
    }
  },
);

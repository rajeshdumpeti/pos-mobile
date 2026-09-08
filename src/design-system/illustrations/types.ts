import type { ComponentType } from 'react';

export type IllustrationRole =
  'welcome' | 'emailVerification' | 'passwordReset' | 'success' | 'offline' | 'securityState';

export type IllustrationArtworkProps = { size: number };

export type IllustrationEntry = {
  Artwork: ComponentType<IllustrationArtworkProps>;
};

export type IllustrationFrameProps = {
  role?: IllustrationRole;
  size?: number;
  testID?: string;
} & (
  | { decorative: true; accessibilityLabel?: never }
  | { decorative?: false; accessibilityLabel: string }
);

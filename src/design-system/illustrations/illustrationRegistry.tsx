import { POSIcon } from '@/design-system/icons';

import type { IllustrationArtworkProps, IllustrationEntry, IllustrationRole } from './types';

// Temporary code-native fallback. Future POS-owned artwork is selected in this registry only.
function PlaceholderArtwork({ size }: IllustrationArtworkProps) {
  return <POSIcon name="info" tone="accent" size={size} />;
}

const fallback: IllustrationEntry = { Artwork: PlaceholderArtwork };

export const illustrationRegistry: Readonly<Record<IllustrationRole, IllustrationEntry>> = {
  welcome: fallback,
  emailVerification: fallback,
  passwordReset: fallback,
  success: fallback,
  offline: fallback,
  securityState: fallback,
};

export function resolveIllustration(role?: string | null): IllustrationEntry {
  if (role && Object.prototype.hasOwnProperty.call(illustrationRegistry, role)) {
    return illustrationRegistry[role as IllustrationRole] ?? fallback;
  }

  return fallback;
}

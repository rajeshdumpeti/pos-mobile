import { Image, ImageSourcePropType } from 'react-native';

import { POSIcon } from '@/design-system/icons';

import emailVerificationAsset from './assets/auth/email-verification.png';
import offlineAsset from './assets/auth/offline.png';
import passwordResetAsset from './assets/auth/password-reset.png';
import securityStateAsset from './assets/auth/security-state.png';
import successAsset from './assets/auth/success.png';
import welcomeAsset from './assets/auth/welcome.png';
import type { IllustrationArtworkProps, IllustrationEntry, IllustrationRole } from './types';

// Temporary code-native fallback. Future POS-owned artwork is selected in this registry only.
function PlaceholderArtwork({ size }: IllustrationArtworkProps) {
  return <POSIcon name="info" tone="accent" size={size} />;
}

const fallback: IllustrationEntry = { Artwork: PlaceholderArtwork };

function createAssetArtwork(source: ImageSourcePropType) {
  return function AssetArtwork({ size }: IllustrationArtworkProps) {
    return (
      <Image
        accessible={false}
        source={source}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    );
  };
}

const welcomeAssetPath = './assets/auth/welcome.png';
const emailVerificationAssetPath = './assets/auth/email-verification.png';
const passwordResetAssetPath = './assets/auth/password-reset.png';
const successAssetPath = './assets/auth/success.png';
const offlineAssetPath = './assets/auth/offline.png';
const securityStateAssetPath = './assets/auth/security-state.png';

export const illustrationAssetPaths: Readonly<Record<IllustrationRole, string>> = {
  welcome: welcomeAssetPath,
  emailVerification: emailVerificationAssetPath,
  passwordReset: passwordResetAssetPath,
  success: successAssetPath,
  offline: offlineAssetPath,
  securityState: securityStateAssetPath,
};

export const illustrationRegistry: Readonly<Record<IllustrationRole, IllustrationEntry>> = {
  welcome: {
    Artwork: createAssetArtwork(welcomeAsset),
    assetPath: welcomeAssetPath,
  },
  emailVerification: {
    Artwork: createAssetArtwork(emailVerificationAsset),
    assetPath: emailVerificationAssetPath,
  },
  passwordReset: {
    Artwork: createAssetArtwork(passwordResetAsset),
    assetPath: passwordResetAssetPath,
  },
  success: {
    Artwork: createAssetArtwork(successAsset),
    assetPath: successAssetPath,
  },
  offline: {
    Artwork: createAssetArtwork(offlineAsset),
    assetPath: offlineAssetPath,
  },
  securityState: {
    Artwork: createAssetArtwork(securityStateAsset),
    assetPath: securityStateAssetPath,
  },
};

export function resolveIllustration(role?: string | null): IllustrationEntry {
  if (role && Object.prototype.hasOwnProperty.call(illustrationRegistry, role)) {
    return illustrationRegistry[role as IllustrationRole] ?? fallback;
  }

  return fallback;
}

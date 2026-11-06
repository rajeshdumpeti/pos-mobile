import { Linking } from 'react-native';
import { AppText, Card, Checkbox, Stack } from '@/design-system';
import { AuthAction } from './AuthAction';

export function LegalBoundary({
  termsUrl,
  privacyUrl,
  termsAccepted,
  privacyAccepted,
  onTermsAccepted,
  onPrivacyAccepted,
  onLinkFailure,
  disabled,
}: {
  termsUrl: string;
  privacyUrl: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  onTermsAccepted: (value: boolean) => void;
  onPrivacyAccepted: (value: boolean) => void;
  onLinkFailure: () => void;
  disabled?: boolean;
}) {
  const open = async (url: string) => {
    try {
      if (!(await Linking.canOpenURL(url))) throw new Error('Unavailable legal URL');
      await Linking.openURL(url);
    } catch {
      onLinkFailure();
    }
  };
  return (
    <Card>
      <Stack gap="xs">
        <AppText variant="label">Review and accept</AppText>
        <AppText variant="caption" color="secondary">
          Review both documents. Opening a document does not accept it.
        </AppText>
        <AuthAction
          label="Terms of Service"
          variant="ghost"
          disabled={disabled}
          accessibilityHint="Opens the Terms of Service"
          onPress={() => void open(termsUrl)}
        />
        <Checkbox
          label="I accept the Terms of Service"
          checked={termsAccepted}
          onChange={onTermsAccepted}
          disabled={disabled}
        />
        <AuthAction
          label="Privacy Policy"
          variant="ghost"
          disabled={disabled}
          accessibilityHint="Opens the Privacy Policy"
          onPress={() => void open(privacyUrl)}
        />
        <Checkbox
          label="I accept the Privacy Policy"
          checked={privacyAccepted}
          onChange={onPrivacyAccepted}
          disabled={disabled}
        />
      </Stack>
    </Card>
  );
}

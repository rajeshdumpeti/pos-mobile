import { useRouter } from 'expo-router';
import { AppText } from '@/design-system';
import { AuthScaffold } from '../components/AuthScaffold';
import { AuthAction } from '../components/AuthAction';
import { RetryPeriod } from '../components/RetryPeriod';

function ReturnToSignIn() {
  const router = useRouter();
  return <AuthAction label="Back to Sign In" onPress={() => router.replace('/(auth)/sign-in')} />;
}
export function ResetSentScreen() {
  return (
    <AuthScaffold
      title="Check your email"
      subtitle="If that address is eligible, instructions will be sent."
      illustration="passwordReset"
      footer={<ReturnToSignIn />}
    />
  );
}
export function PasswordUpdatedScreen() {
  return (
    <AuthScaffold
      title="Password updated"
      subtitle="Your password has been updated. Sign in again to continue."
      illustration="success"
      footer={<ReturnToSignIn />}
    >
      <AppText
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        color="secondary"
        style={{ textAlign: 'center' }}
      >
        Please sign in with your new password.
      </AppText>
    </AuthScaffold>
  );
}
export function OfflineScreen() {
  return (
    <AuthScaffold
      title="You’re offline"
      subtitle="Check your internet connection, then try again when you’re ready."
      illustration="offline"
      footer={<AuthAction label="Try Again" />}
    />
  );
}
export function RateLimitedScreen() {
  return (
    <AuthScaffold
      title="Too many attempts"
      subtitle="Please pause for a short retry period, then try again."
      illustration="securityState"
      footer={<AuthAction label="Try Again" />}
    >
      <RetryPeriod />
    </AuthScaffold>
  );
}
export function SecurityScreen() {
  return (
    <AuthScaffold
      title="Something went wrong"
      subtitle="We couldn’t complete that step. Please try again later."
      illustration="securityState"
      footer={<AuthAction label="Try Again" />}
    />
  );
}

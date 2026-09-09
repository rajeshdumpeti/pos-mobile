import { routes } from '@/navigation/routes';

import { AuthScaffold } from '../components/AuthScaffold';
import { AuthAction } from '../components/AuthAction';
import { CodeEntry } from '../components/CodeEntry';

export function VerifyEmailScreen({ maskedEmail }: { maskedEmail?: string | null }) {
  // Only accept a masked presentation value; never accept a destination through route params.
  const destination = maskedEmail?.includes('*') ? maskedEmail.trim() : undefined;
  return (
    <AuthScaffold
      backFallback={routes.auth.signIn}
      title="Verify your email"
      subtitle={
        destination
          ? `Enter the six-digit code for ${destination}.`
          : 'Enter your six-digit email verification code.'
      }
      illustration="emailVerification"
      footer={<AuthAction label="Continue" />}
    >
      <CodeEntry />
      <AuthAction label="Resend Code" variant="ghost" />
      <AuthAction label="Change Email" variant="ghost" />
    </AuthScaffold>
  );
}

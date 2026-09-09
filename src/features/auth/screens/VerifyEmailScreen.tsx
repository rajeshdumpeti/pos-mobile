import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { routes } from '@/navigation/routes';
import { AuthScaffold } from '../components/AuthScaffold';
import { AuthAction } from '../components/AuthAction';
import { ControlledCodeEntry, verifyEmailSchema, type VerifyEmailFormValues } from '../forms';
import { useAuthSubmissionIntent, type AuthSubmissionHandler } from '../domain';

export function VerifyEmailScreen({
  maskedEmail,
  onSubmitIntent,
}: {
  maskedEmail?: string | null;
  onSubmitIntent?: AuthSubmissionHandler<VerifyEmailFormValues>;
}) {
  const destination = maskedEmail?.includes('*') ? maskedEmail.trim() : undefined;
  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    mode: 'onTouched',
    defaultValues: { code: '' },
  });
  const submit = useAuthSubmissionIntent(onSubmitIntent);
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
      footer={
        <AuthAction
          label="Continue"
          disabled={!form.formState.isValid || form.formState.isSubmitting}
          onPress={() => void form.handleSubmit(submit)()}
        />
      }
    >
      <ControlledCodeEntry control={form.control} name="code" />
      <AuthAction label="Resend Code" variant="ghost" />
      <AuthAction label="Change Email" variant="ghost" />
    </AuthScaffold>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AppText } from '@/design-system';
import { routes } from '@/navigation/routes';
import { AuthScaffold } from '../components/AuthScaffold';
import { AuthAction } from '../components/AuthAction';
import {
  ControlledCodeEntry,
  ControlledEmailField,
  forgotPasswordSchema,
  verifyEmailSchema,
  type VerifyEmailFormValues,
} from '../forms';
import { useAuthSubmissionIntent, type AuthSubmissionHandler } from '../domain';
import type { AuthSubmissionHandler as SubmissionHandler } from '../domain';
import { useAuthoritativeDeadline, useVerificationController } from '../integration';

export function VerifyEmailScreen({
  maskedEmail,
  onSubmitIntent,
  onResend,
  onChangeEmail,
  busy = false,
  resendBusy = false,
  changeBusy = false,
  resendRemainingSeconds,
  message,
  messageIsError = false,
  missingContext = false,
  onBack,
}: {
  maskedEmail?: string | null;
  onSubmitIntent?: AuthSubmissionHandler<VerifyEmailFormValues>;
  onResend?: () => Promise<boolean>;
  onChangeEmail?: SubmissionHandler<{ email: string }>;
  busy?: boolean;
  resendBusy?: boolean;
  changeBusy?: boolean;
  resendRemainingSeconds?: number;
  message?: string;
  messageIsError?: boolean;
  missingContext?: boolean;
  onBack?: () => void;
}) {
  const destination = maskedEmail?.includes('*') ? maskedEmail.trim() : undefined;
  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    mode: 'onTouched',
    defaultValues: { code: '' },
  });
  const submit = useAuthSubmissionIntent(onSubmitIntent);
  const changeForm = useForm<{ email: string }>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  });
  const [changing, setChanging] = useState(false);
  const resendReady = resendRemainingSeconds === undefined || resendRemainingSeconds === 0;
  return (
    <AuthScaffold
      backFallback={routes.auth.signIn}
      onBack={onBack}
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
          loading={busy}
          disabled={!form.formState.isValid || busy || missingContext}
          onPress={() =>
            void form.handleSubmit(async (values) => {
              const succeeded = await submit(values);
              if (!succeeded) form.resetField('code');
            })()
          }
        />
      }
    >
      <ControlledCodeEntry control={form.control} name="code" />
      {message ? (
        <AppText accessibilityRole="alert" color={messageIsError ? 'danger' : 'primary'}>
          {message}
        </AppText>
      ) : null}
      {missingContext ? (
        <AppText accessibilityRole="alert">
          Verification details are unavailable. Return to Sign In and start again.
        </AppText>
      ) : null}
      <AuthAction
        label={
          resendRemainingSeconds && resendRemainingSeconds > 0
            ? `Resend Code in ${resendRemainingSeconds}s`
            : 'Resend Code'
        }
        variant="ghost"
        loading={resendBusy}
        disabled={!resendReady || busy || changeBusy || missingContext}
        onPress={
          onResend
            ? () =>
                void onResend().then((succeeded) => {
                  if (succeeded) form.resetField('code');
                })
            : undefined
        }
      />
      <AuthAction
        label="Change Email"
        variant="ghost"
        disabled={busy || resendBusy || missingContext}
        onPress={onChangeEmail ? () => setChanging((value) => !value) : undefined}
      />
      {changing && onChangeEmail ? (
        <>
          <ControlledEmailField control={changeForm.control} name="email" />
          <AuthAction
            label="Update Email"
            loading={changeBusy}
            disabled={!changeForm.formState.isValid || changeBusy}
            onPress={() =>
              void changeForm.handleSubmit(async (values) => {
                const succeeded = await onChangeEmail(values);
                if (succeeded) {
                  changeForm.reset();
                  form.resetField('code');
                  setChanging(false);
                }
              })()
            }
          />
        </>
      ) : null}
    </AuthScaffold>
  );
}

export function ConnectedVerifyEmailScreen() {
  const router = useRouter();
  const controller = useVerificationController({
    onVerified: () => router.replace(routes.auth.signIn),
  });
  const deadline = useAuthoritativeDeadline(
    controller.retryDeadlineMs ?? controller.presentation?.resendAvailableAt,
  );
  return (
    <VerifyEmailScreen
      maskedEmail={controller.presentation?.maskedEmail}
      missingContext={!controller.presentation}
      onSubmitIntent={({ code }) => controller.verifyCode(code)}
      onResend={controller.resendCode}
      onChangeEmail={({ email }) => controller.changeEmail(email)}
      busy={controller.isVerifying}
      resendBusy={controller.isResending}
      changeBusy={controller.isChangingEmail}
      resendRemainingSeconds={deadline.remainingSeconds}
      message={
        (controller.failure && 'message' in controller.failure
          ? controller.failure.message
          : undefined) ?? controller.notice
      }
      messageIsError={Boolean(controller.failure)}
      onBack={controller.clear}
    />
  );
}

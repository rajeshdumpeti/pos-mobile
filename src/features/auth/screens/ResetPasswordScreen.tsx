import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppText, Card } from '@/design-system';
import { routes } from '@/navigation/routes';
import { AuthAction } from '../components/AuthAction';
import { PasswordProgress } from '../components/PasswordProgress';
import { AuthScaffold } from '../components/AuthScaffold';
import {
  ControlledPasswordField,
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '../forms';
import { useAuthSubmissionIntent, type AuthSubmissionHandler } from '../domain';
import type { ResetPasswordIntent } from '../forms/schemas';
import { useRouter } from 'expo-router';
import {
  useAuthenticationCapabilities,
  usePasswordResetState,
  useResetPasswordController,
} from '../integration';

export function ResetPasswordScreen({
  continuationAvailable = false,
  onSubmitIntent,
  submitting = false,
  failureMessage,
  onClear,
}: {
  continuationAvailable?: boolean;
  onSubmitIntent?: AuthSubmissionHandler<ResetPasswordIntent>;
  submitting?: boolean;
  failureMessage?: string;
  onClear?: () => void;
}) {
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: { password: '', confirmPassword: '' },
  });
  const submit = useAuthSubmissionIntent(onSubmitIntent);
  const ready = continuationAvailable && form.formState.isValid;
  const onValid = async (values: ResetPasswordFormValues) => {
    const succeeded = await submit({ newPassword: values.password });
    if (succeeded !== false) form.reset();
  };
  return (
    <AuthScaffold
      backFallback={routes.auth.signIn}
      onBack={onClear}
      title="Reset Password"
      subtitle="Choose a new password for your POS account."
      footer={
        <AuthAction
          label="Update Password"
          loading={submitting}
          disabled={!ready || form.formState.isSubmitting || submitting}
          onPress={() => void form.handleSubmit(onValid)()}
        />
      }
    >
      {!continuationAvailable && (
        <Card>
          <AppText color="secondary">
            This reset link is unavailable. Return to Sign In and request a new link.
          </AppText>
        </Card>
      )}
      {failureMessage ? (
        <AppText accessibilityRole="alert" color="danger">
          {failureMessage}
        </AppText>
      ) : null}
      <ControlledPasswordField
        control={form.control}
        name="password"
        label="New password"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <PasswordProgress password={form.watch('password')} />
      <ControlledPasswordField
        control={form.control}
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        textContentType="newPassword"
      />
    </AuthScaffold>
  );
}

export function ConnectedResetPasswordScreen() {
  const router = useRouter();
  const state = usePasswordResetState();
  const { passwordRecovery } = useAuthenticationCapabilities();
  const controller = useResetPasswordController({
    onSuccess: () => router.replace(routes.auth.passwordUpdated),
  });
  const stateFailure =
    state === 'expired'
      ? 'This password reset link has expired. Request a new link.'
      : state === 'invalid'
        ? 'This password reset link is unavailable. Request a new link.'
        : undefined;
  return (
    <ResetPasswordScreen
      continuationAvailable={state === 'ready' || state === 'submitting'}
      onSubmitIntent={controller.submit}
      submitting={controller.isSubmitting}
      failureMessage={
        controller.failure && 'message' in controller.failure
          ? controller.failure.message
          : stateFailure
      }
      onClear={passwordRecovery.clear}
    />
  );
}

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

export function ResetPasswordScreen({
  continuationAvailable = false,
  onSubmitIntent,
}: {
  continuationAvailable?: boolean;
  onSubmitIntent?: AuthSubmissionHandler<ResetPasswordIntent>;
}) {
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: { password: '', confirmPassword: '' },
  });
  const submit = useAuthSubmissionIntent(onSubmitIntent);
  const ready = continuationAvailable && form.formState.isValid;
  const onValid = (values: ResetPasswordFormValues) => submit({ newPassword: values.password });
  return (
    <AuthScaffold
      backFallback={routes.auth.signIn}
      title="Reset Password"
      subtitle="Choose a new password for your POS account."
      footer={
        <AuthAction
          label="Update Password"
          disabled={!ready || form.formState.isSubmitting}
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

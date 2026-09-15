import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppText, Card } from '@/design-system';
import { AuthScaffold } from '../components/AuthScaffold';
import { AuthAction } from '../components/AuthAction';
import {
  ControlledEmailField,
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '../forms';
import { useAuthSubmissionIntent, type AuthSubmissionHandler } from '../domain';
import { useRouter } from 'expo-router';
import { routes } from '@/navigation/routes';
import { useForgotPasswordController } from '../integration';

export function ForgotPasswordScreen({
  onSubmitIntent,
  submitting = false,
  failureMessage,
}: {
  onSubmitIntent?: AuthSubmissionHandler<ForgotPasswordFormValues>;
  submitting?: boolean;
  failureMessage?: string;
}) {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  });
  const submit = useAuthSubmissionIntent(onSubmitIntent);
  return (
    <AuthScaffold
      modal
      title="Forgot Password?"
      subtitle="A fresh start is within reach. Enter your email to request reset instructions."
      footer={
        <AuthAction
          label="Request Reset Instructions"
          loading={submitting}
          disabled={!form.formState.isValid || form.formState.isSubmitting || submitting}
          onPress={() =>
            void form.handleSubmit(async (values) => {
              const accepted = await submit(values);
              if (accepted !== false) form.reset();
            })()
          }
        />
      }
    >
      {failureMessage ? (
        <AppText accessibilityRole="alert" color="danger">
          {failureMessage}
        </AppText>
      ) : null}
      <ControlledEmailField control={form.control} name="email" editable={!submitting} />
      <Card>
        <AppText color="secondary">If that address is eligible, instructions will be sent.</AppText>
      </Card>
    </AuthScaffold>
  );
}

export function ConnectedForgotPasswordScreen() {
  const router = useRouter();
  const controller = useForgotPasswordController({
    onAccepted: () => router.replace(routes.auth.resetLinkSent),
  });
  return (
    <ForgotPasswordScreen
      onSubmitIntent={controller.submit}
      submitting={controller.isSubmitting}
      failureMessage={
        controller.failure && 'message' in controller.failure
          ? controller.failure.message
          : undefined
      }
    />
  );
}

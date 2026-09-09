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

export function ForgotPasswordScreen({
  onSubmitIntent,
}: {
  onSubmitIntent?: AuthSubmissionHandler<ForgotPasswordFormValues>;
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
          disabled={!form.formState.isValid || form.formState.isSubmitting}
          onPress={() => void form.handleSubmit(submit)()}
        />
      }
    >
      <ControlledEmailField control={form.control} name="email" />
      <Card>
        <AppText color="secondary">If that address is eligible, instructions will be sent.</AppText>
      </Card>
    </AuthScaffold>
  );
}

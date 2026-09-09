import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { routes } from '@/navigation/routes';
import { AuthScaffold } from '../components/AuthScaffold';
import { AuthAction } from '../components/AuthAction';
import { LegalBoundary } from '../components/LegalBoundary';
import {
  ControlledEmailField,
  ControlledPasswordField,
  ControlledTextField,
  createAccountSchema,
  type CreateAccountFormValues,
} from '../forms';
import { useAuthSubmissionIntent, type AuthSubmissionHandler } from '../domain';
import type { CreateAccountIntent } from '../forms/schemas';

export function CreateAccountScreen({
  onSubmitIntent,
}: {
  onSubmitIntent?: AuthSubmissionHandler<CreateAccountIntent>;
}) {
  const router = useRouter();
  const form = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountSchema),
    mode: 'onTouched',
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  });
  const submit = useAuthSubmissionIntent(onSubmitIntent);
  const onValid = (values: CreateAccountFormValues) =>
    submit({ displayName: values.displayName, email: values.email, password: values.password });
  return (
    <AuthScaffold
      title="Create Account"
      subtitle="Start building a life with more intention."
      footer={
        <>
          <AuthAction
            label="Create Account"
            disabled={!form.formState.isValid || form.formState.isSubmitting}
            onPress={() => void form.handleSubmit(onValid)()}
          />
          <AuthAction
            label="Sign In"
            variant="ghost"
            onPress={() => router.replace(routes.auth.signIn)}
          />
        </>
      }
    >
      <ControlledTextField
        control={form.control}
        name="displayName"
        label="Full name"
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
      />
      <ControlledEmailField control={form.control} name="email" />
      <ControlledPasswordField
        control={form.control}
        name="password"
        label="Password"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <ControlledPasswordField
        control={form.control}
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <LegalBoundary />
    </AuthScaffold>
  );
}

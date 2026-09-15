import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { AppText } from '@/design-system';
import { routes } from '@/navigation/routes';
import { AuthScaffold } from '../components/AuthScaffold';
import { AuthAction } from '../components/AuthAction';
import {
  ControlledEmailField,
  ControlledPasswordField,
  signInSchema,
  type SignInFormValues,
} from '../forms';
import { useAuthSubmissionIntent, type AuthSubmissionHandler } from '../domain';
import { useAuthenticationCapabilities, useSignInController } from '../integration';

export function SignInScreen({
  onSubmitIntent,
  verificationSucceeded = false,
  submitting = false,
  failureMessage,
}: {
  onSubmitIntent?: AuthSubmissionHandler<SignInFormValues>;
  verificationSucceeded?: boolean;
  submitting?: boolean;
  failureMessage?: string;
}) {
  const router = useRouter();
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });
  const submit = useAuthSubmissionIntent(onSubmitIntent);
  return (
    <AuthScaffold
      title="Sign In"
      subtitle="Welcome back. Make space for what matters."
      footer={
        <>
          <AuthAction
            label="Sign In"
            loading={submitting}
            disabled={!form.formState.isValid || form.formState.isSubmitting || submitting}
            onPress={() =>
              void form.handleSubmit(async (values) => {
                await submit(values);
                form.resetField('password');
              })()
            }
          />
          <AuthAction
            label="Create Account"
            variant="ghost"
            disabled={submitting}
            onPress={() => router.push(routes.auth.createAccount)}
          />
        </>
      }
    >
      {verificationSucceeded ? (
        <AppText accessibilityRole="alert" color="accent">
          Email verified—sign in to continue.
        </AppText>
      ) : null}
      {failureMessage ? (
        <AppText accessibilityRole="alert" color="danger">
          {failureMessage}
        </AppText>
      ) : null}
      <ControlledEmailField control={form.control} name="email" editable={!submitting} />
      <ControlledPasswordField
        control={form.control}
        name="password"
        label="Password"
        autoComplete="current-password"
        textContentType="password"
        editable={!submitting}
      />
      <AuthAction
        label="Forgot Password?"
        variant="ghost"
        disabled={submitting}
        onPress={() => router.navigate(routes.auth.forgotPassword)}
      />
    </AuthScaffold>
  );
}

export function ConnectedSignInScreen() {
  const { registration } = useAuthenticationCapabilities();
  const [verificationSucceeded] = useState(registration.takeVerificationSuccess);
  const router = useRouter();
  const controller = useSignInController({
    onAuthenticated: () => router.replace(routes.app.index),
    onVerificationRequired: () => router.replace(routes.auth.verifyEmail),
  });
  return (
    <SignInScreen
      verificationSucceeded={verificationSucceeded}
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

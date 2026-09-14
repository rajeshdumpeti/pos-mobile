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
import { useAuthenticationCapabilities } from '../integration';

export function SignInScreen({
  onSubmitIntent,
  verificationSucceeded = false,
}: {
  onSubmitIntent?: AuthSubmissionHandler<SignInFormValues>;
  verificationSucceeded?: boolean;
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
            disabled={!form.formState.isValid || form.formState.isSubmitting}
            onPress={() => void form.handleSubmit(submit)()}
          />
          <AuthAction
            label="Create Account"
            variant="ghost"
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
      <ControlledEmailField control={form.control} name="email" />
      <ControlledPasswordField
        control={form.control}
        name="password"
        label="Password"
        autoComplete="current-password"
        textContentType="password"
      />
      <AuthAction
        label="Forgot Password?"
        variant="ghost"
        onPress={() => router.navigate(routes.auth.forgotPassword)}
      />
    </AuthScaffold>
  );
}

export function ConnectedSignInScreen() {
  const { registration } = useAuthenticationCapabilities();
  const [verificationSucceeded] = useState(registration.takeVerificationSuccess);
  return <SignInScreen verificationSucceeded={verificationSucceeded} />;
}

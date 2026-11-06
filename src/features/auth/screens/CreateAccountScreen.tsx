import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { AppText } from '@/design-system';
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
import type { RegistrationPolicy } from '../integration';
import { useRegistrationController } from '../integration';

export function CreateAccountScreen({
  onSubmitIntent,
  policy,
  policyLoading = false,
  policyFailure,
  onRetryPolicy,
  submitting = false,
  failureMessage,
}: {
  onSubmitIntent?: AuthSubmissionHandler<CreateAccountIntent>;
  policy?: RegistrationPolicy;
  policyLoading?: boolean;
  policyFailure?: boolean;
  onRetryPolicy?: () => void;
  submitting?: boolean;
  failureMessage?: string;
}) {
  const router = useRouter();
  const form = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountSchema),
    mode: 'onTouched',
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [linkFailure, setLinkFailure] = useState(false);
  const submit = useAuthSubmissionIntent(onSubmitIntent);
  useEffect(
    () => () => {
      form.resetField('password');
      form.resetField('confirmPassword');
    },
    [form],
  );
  const onValid = async (values: CreateAccountFormValues) => {
    const succeeded = await submit({
      displayName: values.displayName,
      email: values.email,
      password: values.password,
    });
    if (succeeded) {
      form.resetField('password');
      form.resetField('confirmPassword');
    }
  };
  const consentReady =
    policy?.mode === 'deferred' ||
    (policy?.mode === 'required' && termsAccepted && privacyAccepted);
  const busy = submitting || form.formState.isSubmitting;
  return (
    <AuthScaffold
      title="Create Account"
      subtitle="Start building a life with more intention."
      footer={
        <>
          <AuthAction
            label="Create Account"
            loading={busy}
            disabled={!form.formState.isValid || !policy || !consentReady || busy}
            onPress={() => void form.handleSubmit(onValid)()}
          />
          <AuthAction
            label="Sign In"
            variant="ghost"
            disabled={busy}
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
      {policyLoading ? (
        <AppText accessibilityRole="alert">Loading registration policy…</AppText>
      ) : null}
      {policyFailure ? (
        <>
          <AppText accessibilityRole="alert" color="danger">
            Registration policy is temporarily unavailable.
          </AppText>
          <AuthAction label="Retry Registration Policy" onPress={onRetryPolicy} />
        </>
      ) : null}
      {policy?.mode === 'required' ? (
        <LegalBoundary
          termsUrl={policy.termsUrl}
          privacyUrl={policy.privacyUrl}
          termsAccepted={termsAccepted}
          privacyAccepted={privacyAccepted}
          onTermsAccepted={setTermsAccepted}
          onPrivacyAccepted={setPrivacyAccepted}
          onLinkFailure={() => setLinkFailure(true)}
          disabled={busy}
        />
      ) : null}
      {linkFailure ? (
        <AppText accessibilityRole="alert" color="danger">
          This document could not be opened. Try again.
        </AppText>
      ) : null}
      {failureMessage ? (
        <AppText accessibilityRole="alert" color="danger">
          {failureMessage}
        </AppText>
      ) : null}
    </AuthScaffold>
  );
}

export function ConnectedCreateAccountScreen() {
  const router = useRouter();
  const [policyRevision, setPolicyRevision] = useState(0);
  const controller = useRegistrationController({
    onSuccess: () => router.push(routes.auth.verifyEmail),
    onPolicyChanged: () => setPolicyRevision((value) => value + 1),
  });
  return (
    <CreateAccountScreen
      key={policyRevision}
      policy={controller.policyQuery.data}
      policyLoading={controller.policyQuery.isLoading}
      policyFailure={controller.policyQuery.isError}
      onRetryPolicy={() => void controller.policyQuery.refetch()}
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

import type { components } from '@/api/generated/schema';
import type { AuthenticationService } from '@/api/services/authenticationService';

type Schemas = components['schemas'];
type Pending = Schemas['PendingVerificationResponse'];
type Continuation = Schemas['VerificationFlowContinuation'];

export type RegistrationPolicy =
  | {
      mode: 'deferred';
      legalConsentRequired: false;
    }
  | {
      mode: 'required';
      legalConsentRequired: true;
      termsVersion: string;
      termsUrl: string;
      privacyVersion: string;
      privacyUrl: string;
    };

export type VerificationPresentation = {
  maskedEmail: string;
  verificationExpiresAt: string;
  flowExpiresAt: string;
  resendAvailableAt: string;
};

export type RegistrationInput = {
  displayName: string;
  email: string;
  password: string;
  policy: RegistrationPolicy;
};

function validDate(value: string) {
  return Number.isFinite(Date.parse(value));
}

function validHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.hash;
  } catch {
    return false;
  }
}

export function validateRegistrationPolicy(
  value: Schemas['RegistrationPolicyResponse'],
): RegistrationPolicy {
  if (
    value.legal_consent_required === false &&
    value.legal_policy_status === 'deferred_nonproduction' &&
    value.terms_version == null &&
    value.terms_url == null &&
    value.privacy_version == null &&
    value.privacy_url == null
  ) {
    return { mode: 'deferred', legalConsentRequired: false };
  }
  if (
    value.legal_consent_required === true &&
    value.legal_policy_status === 'active' &&
    typeof value.terms_version === 'string' &&
    value.terms_version.length > 0 &&
    typeof value.privacy_version === 'string' &&
    value.privacy_version.length > 0 &&
    typeof value.terms_url === 'string' &&
    validHttpsUrl(value.terms_url) &&
    typeof value.privacy_url === 'string' &&
    validHttpsUrl(value.privacy_url)
  ) {
    return {
      mode: 'required',
      legalConsentRequired: true,
      termsVersion: value.terms_version,
      termsUrl: value.terms_url,
      privacyVersion: value.privacy_version,
      privacyUrl: value.privacy_url,
    };
  }
  throw new Error('Registration policy response is invalid.');
}

function validatePending(value: Pending): VerificationPresentation {
  if (
    value.status !== 'registration_pending' ||
    !value.flow_token ||
    !value.masked_email.includes('*') ||
    !validDate(value.verification_expires_at) ||
    !validDate(value.flow_expires_at) ||
    !validDate(value.resend_available_at)
  ) {
    throw new Error('Verification response is invalid.');
  }
  return {
    maskedEmail: value.masked_email,
    verificationExpiresAt: value.verification_expires_at,
    flowExpiresAt: value.flow_expires_at,
    resendAvailableAt: value.resend_available_at,
  };
}

export function createRegistrationWorkflow(service: AuthenticationService) {
  let flowToken: string | undefined;
  let presentation: VerificationPresentation | undefined;
  let verificationSucceeded = false;
  const listeners = new Set<() => void>();
  const publish = () => listeners.forEach((listener) => listener());
  const capture = (pending: Pending) => {
    const safe = validatePending(pending);
    flowToken = pending.flow_token;
    presentation = safe;
    publish();
    return safe;
  };
  const captureContinuation = (value: Continuation) =>
    capture({
      status: 'registration_pending',
      flow_token: value.flow_token,
      masked_email: value.masked_email,
      verification_expires_at: value.expires_at,
      flow_expires_at: value.expires_at,
      resend_available_at: value.resend_available_at,
    });
  const requireFlow = () => {
    if (!flowToken) throw new Error('Verification context is unavailable.');
    return flowToken;
  };
  return {
    getRegistrationPolicy: async () =>
      validateRegistrationPolicy(await service.getRegistrationPolicy()),
    register: async ({ displayName, email, password, policy }: RegistrationInput) => {
      const body: Schemas['RegistrationRequest'] = {
        display_name: displayName,
        email,
        password,
        ...(policy.mode === 'required'
          ? {
              terms_accepted: true,
              privacy_accepted: true,
              terms_version: policy.termsVersion,
              privacy_version: policy.privacyVersion,
            }
          : {}),
      };
      return capture(await service.register(body));
    },
    verifyEmail: (code: string) => service.verifyEmail({ flow_token: requireFlow(), code }),
    resendVerification: async () =>
      capture(await service.resendVerification({ flow_token: requireFlow() })),
    changeUnverifiedEmail: async (newEmail: string) =>
      capture(
        await service.changeUnverifiedEmail({ flow_token: requireFlow(), new_email: newEmail }),
      ),
    replaceVerificationContinuation: captureContinuation,
    getVerificationPresentation: () => presentation,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    clear: () => {
      flowToken = undefined;
      presentation = undefined;
      publish();
    },
    completeVerification: () => {
      flowToken = undefined;
      presentation = undefined;
      verificationSucceeded = true;
      publish();
    },
    takeVerificationSuccess: () => {
      const value = verificationSucceeded;
      verificationSucceeded = false;
      return value;
    },
  };
}

export type RegistrationWorkflow = ReturnType<typeof createRegistrationWorkflow>;

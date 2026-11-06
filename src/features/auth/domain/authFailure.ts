import { z } from 'zod';

import type {
  AuthContractFailureCode,
  AuthOperationFailure,
  AuthTransportFailure,
} from './authOperation';

const knownCodes = [
  'invalid_credentials',
  'email_not_verified',
  'account_unavailable',
  'account_already_exists',
  'refresh_session_invalid',
  'refresh_session_expired',
  'refresh_session_replayed',
  'refresh_idempotency_conflict',
  'authentication_required',
  'access_token_invalid',
  'access_token_expired',
  'verification_flow_invalid',
  'verification_flow_expired',
  'verification_code_invalid',
  'verification_code_expired',
  'verification_attempts_exceeded',
  'resend_cooldown_active',
  'reset_token_invalid',
  'reset_token_expired',
  'password_rejected',
  'legal_acceptance_outdated',
  'legal_consent_required',
  'legal_consent_not_applicable',
  'authentication_configuration_unavailable',
  'dependency_unavailable',
  'internal_server_error',
  'rate_limited',
  'request_validation_failed',
  'request_too_large',
  'unsupported_media_type',
] as const satisfies readonly AuthContractFailureCode[];

const failureEnvelope = z
  .object({
    code: z.enum(knownCodes),
    request_id: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/)
      .optional(),
    retry_after_seconds: z.number().int().min(1).max(3600).optional(),
    retry_at: z
      .string()
      .max(64)
      .refine((value) => Number.isFinite(Date.parse(value)))
      .optional(),
    actions: z
      .array(z.enum(['verify_email', 'refresh_registration_policy', 'sign_in', 'forgot_password']))
      .max(4)
      .optional(),
  })
  .passthrough();

const presentations: Record<
  AuthContractFailureCode,
  Pick<AuthOperationFailure, 'category' | 'message'>
> = {
  invalid_credentials: {
    category: 'invalidCredentials',
    message: 'Email or password is incorrect.',
  },
  email_not_verified: {
    category: 'verificationRequired',
    message: 'Email verification is required.',
  },
  account_unavailable: {
    category: 'securityDenied',
    message: 'This account is unavailable.',
  },
  account_already_exists: { category: 'securityDenied', message: 'This account already exists.' },
  refresh_session_invalid: { category: 'securityDenied', message: 'Please sign in again.' },
  refresh_session_expired: { category: 'securityDenied', message: 'Please sign in again.' },
  refresh_session_replayed: { category: 'securityDenied', message: 'Please sign in again.' },
  refresh_idempotency_conflict: { category: 'securityDenied', message: 'Please sign in again.' },
  authentication_required: { category: 'securityDenied', message: 'Please sign in again.' },
  access_token_invalid: { category: 'securityDenied', message: 'Please sign in again.' },
  access_token_expired: { category: 'securityDenied', message: 'Please sign in again.' },
  verification_flow_invalid: {
    category: 'verificationUnavailable',
    message: 'This verification request is unavailable.',
  },
  verification_flow_expired: {
    category: 'verificationUnavailable',
    message: 'This verification request has expired.',
  },
  verification_code_invalid: {
    category: 'verificationUnavailable',
    message: 'The verification code is incorrect.',
  },
  verification_code_expired: {
    category: 'verificationUnavailable',
    message: 'The verification code has expired.',
  },
  verification_attempts_exceeded: {
    category: 'rateLimited',
    message: 'Too many verification attempts. Try again later.',
  },
  resend_cooldown_active: {
    category: 'rateLimited',
    message: 'Please wait before requesting another code.',
  },
  reset_token_invalid: {
    category: 'resetUnavailable',
    message: 'This password reset link is unavailable.',
  },
  reset_token_expired: {
    category: 'resetUnavailable',
    message: 'This password reset link has expired.',
  },
  password_rejected: {
    category: 'securityDenied',
    message: 'The password was not accepted.',
  },
  legal_acceptance_outdated: {
    category: 'securityDenied',
    message: 'The registration terms have changed.',
  },
  legal_consent_required: {
    category: 'securityDenied',
    message: 'Review and accept the current Terms and Privacy Policy.',
  },
  legal_consent_not_applicable: {
    category: 'securityDenied',
    message: 'Registration policy changed. Review the current form and try again.',
  },
  authentication_configuration_unavailable: {
    category: 'serverUnavailable',
    message: 'Registration is temporarily unavailable.',
  },
  dependency_unavailable: {
    category: 'serverUnavailable',
    message: 'Authentication is temporarily unavailable.',
  },
  internal_server_error: {
    category: 'serverUnavailable',
    message: 'Authentication is temporarily unavailable.',
  },
  rate_limited: {
    category: 'rateLimited',
    message: 'Please wait before trying again.',
  },
  request_validation_failed: {
    category: 'unexpected',
    message: 'Review the information and try again.',
  },
  request_too_large: {
    category: 'unexpected',
    message: 'We could not complete that request.',
  },
  unsupported_media_type: {
    category: 'unexpected',
    message: 'We could not complete that request.',
  },
};

export function mapAuthFailure(input: unknown): AuthOperationFailure {
  const raw = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const requestId =
    typeof raw.request_id === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(raw.request_id)
      ? raw.request_id
      : undefined;
  const retryAfterSeconds =
    typeof raw.retry_after_seconds === 'number' &&
    Number.isInteger(raw.retry_after_seconds) &&
    raw.retry_after_seconds >= 1 &&
    raw.retry_after_seconds <= 3600
      ? raw.retry_after_seconds
      : undefined;
  const retryAt =
    typeof raw.retry_at === 'string' &&
    raw.retry_at.length <= 64 &&
    Number.isFinite(Date.parse(raw.retry_at))
      ? raw.retry_at
      : undefined;
  const allowedActions = [
    'verify_email',
    'refresh_registration_policy',
    'sign_in',
    'forgot_password',
  ];
  const actions = Array.isArray(raw.actions)
    ? raw.actions.filter((action) => typeof action === 'string' && allowedActions.includes(action))
    : undefined;
  const parsed = failureEnvelope.safeParse({
    code: raw.code,
    request_id: requestId,
    retry_after_seconds: retryAfterSeconds,
    retry_at: retryAt,
    actions,
  });
  if (!parsed.success) {
    return {
      kind: 'operation',
      category: 'unexpected',
      message: 'We could not complete that step.',
    };
  }
  const presentation = presentations[parsed.data.code];
  return {
    kind: 'operation',
    code: parsed.data.code,
    ...presentation,
    ...(parsed.data.request_id ? { requestId: parsed.data.request_id } : {}),
    ...(parsed.data.retry_after_seconds
      ? { retryAfterSeconds: parsed.data.retry_after_seconds }
      : {}),
    ...(parsed.data.retry_at ? { retryAt: parsed.data.retry_at } : {}),
    ...(parsed.data.actions ? { actions: parsed.data.actions } : {}),
  };
}

export function offlineAuthFailure(): AuthTransportFailure {
  return {
    kind: 'transport',
    category: 'offline',
    message: 'Check your connection and try again.',
  };
}

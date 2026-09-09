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
  'dependency_unavailable',
  'internal_server_error',
  'rate_limited',
] as const satisfies readonly AuthContractFailureCode[];

const failureEnvelope = z
  .object({
    code: z.enum(knownCodes),
    request_id: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9._-]+$/)
      .optional(),
    retry_after_seconds: z.number().int().min(1).max(3600).optional(),
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
};

export function mapAuthFailure(input: unknown): AuthOperationFailure {
  const parsed = failureEnvelope.safeParse(input);
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
  };
}

export function offlineAuthFailure(): AuthTransportFailure {
  return {
    kind: 'transport',
    category: 'offline',
    message: 'Check your connection and try again.',
  };
}

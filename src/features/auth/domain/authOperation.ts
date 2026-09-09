export type AuthOperationState<TSuccess = never> =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'succeeded'; data: TSuccess }
  | { status: 'failed'; failure: AuthFailure };

export type AuthOperationEvent<TSuccess> =
  | { type: 'submit' }
  | { type: 'succeed'; data: TSuccess }
  | { type: 'fail'; failure: AuthFailure }
  | { type: 'reset' };

export type AuthFieldFailure = {
  kind: 'localValidation';
  fields: Readonly<Record<string, string>>;
};

export type AuthContractFailureCode =
  | 'invalid_credentials'
  | 'email_not_verified'
  | 'account_unavailable'
  | 'account_already_exists'
  | 'refresh_session_invalid'
  | 'refresh_session_expired'
  | 'refresh_session_replayed'
  | 'refresh_idempotency_conflict'
  | 'authentication_required'
  | 'access_token_invalid'
  | 'access_token_expired'
  | 'verification_flow_invalid'
  | 'verification_flow_expired'
  | 'verification_code_invalid'
  | 'verification_code_expired'
  | 'verification_attempts_exceeded'
  | 'resend_cooldown_active'
  | 'reset_token_invalid'
  | 'reset_token_expired'
  | 'password_rejected'
  | 'legal_acceptance_outdated'
  | 'dependency_unavailable'
  | 'internal_server_error'
  | 'rate_limited';

export type AuthOperationFailure = {
  kind: 'operation';
  category:
    | 'invalidCredentials'
    | 'verificationRequired'
    | 'verificationUnavailable'
    | 'resetUnavailable'
    | 'rateLimited'
    | 'securityDenied'
    | 'serverUnavailable'
    | 'unexpected';
  message: string;
  code?: AuthContractFailureCode;
  requestId?: string;
  retryAfterSeconds?: number;
};

export type AuthTransportFailure = {
  kind: 'transport';
  category: 'offline' | 'timeout' | 'cancelled';
  message: string;
};

export type AuthFailure = AuthFieldFailure | AuthOperationFailure | AuthTransportFailure;

export function reduceAuthOperation<TSuccess>(
  _state: AuthOperationState<TSuccess>,
  event: AuthOperationEvent<TSuccess>,
): AuthOperationState<TSuccess> {
  switch (event.type) {
    case 'submit':
      return { status: 'submitting' };
    case 'succeed':
      return { status: 'succeeded', data: event.data };
    case 'fail':
      return { status: 'failed', failure: event.failure };
    case 'reset':
      return { status: 'idle' };
  }
}

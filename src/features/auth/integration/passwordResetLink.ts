import { isValidResetToken } from './passwordRecoveryWorkflow';

export type ResetLinkResult = { accepted: true; token: string } | { accepted: false };

// The app configuration owns this development link. Production HTTPS links require
// the associated-domain work and backend reset-base configuration tracked for 1.H.
export function parsePasswordResetLink(input: string): ResetLinkResult {
  try {
    const url = new URL(input);
    if (
      url.protocol !== 'pos:' ||
      url.hostname !== 'reset-password' ||
      (url.pathname !== '' && url.pathname !== '/') ||
      url.username ||
      url.password ||
      url.hash
    ) {
      return { accepted: false };
    }
    const fields = url.search.startsWith('?') ? url.search.slice(1).split('&') : [];
    if (fields.length !== 1) return { accepted: false };
    const field = fields[0];
    if (field === undefined) return { accepted: false };
    const separator = field.indexOf('=');
    if (separator < 0) return { accepted: false };
    const name = decodeURIComponent(field.slice(0, separator));
    if (name !== 'token') return { accepted: false };
    // decodeURIComponent follows URI encoding without URLSearchParams' `+` → space mutation.
    const token = decodeURIComponent(field.slice(separator + 1));
    return isValidResetToken(token) ? { accepted: true, token } : { accepted: false };
  } catch {
    return { accepted: false };
  }
}

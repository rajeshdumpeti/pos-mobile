import { routes } from './routes';

export type NavigationAccessStatus = 'checking' | 'signedOut' | 'onboarding' | 'signedIn';
export type EntryDestination =
  typeof routes.auth.welcome | typeof routes.onboarding.index | typeof routes.app.index | null;

const signedInRestrictedAuthEntries = new Set([
  '/welcome',
  '/sign-in',
  '/create-account',
  routes.auth.welcome,
  routes.auth.signIn,
  routes.auth.createAccount,
]);

export function resolveEntryDestination(status: NavigationAccessStatus): EntryDestination {
  if (status === 'checking') return null;
  if (status === 'onboarding') return routes.onboarding.index;
  return status === 'signedIn' ? routes.app.index : routes.auth.welcome;
}

export function resolveUnknownRouteDestination(status: NavigationAccessStatus) {
  if (status === 'onboarding') return routes.onboarding.index;
  return status === 'signedIn' ? routes.app.index : routes.auth.welcome;
}

export function shouldRedirectAuthRoute(status: NavigationAccessStatus, pathname: string): boolean {
  return (
    (status === 'signedIn' || status === 'onboarding') &&
    signedInRestrictedAuthEntries.has(pathname)
  );
}

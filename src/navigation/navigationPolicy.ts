import { routes } from './routes';

export type NavigationAccessStatus = 'checking' | 'signedOut' | 'signedIn';
export type EntryDestination = typeof routes.auth.welcome | typeof routes.app.index | null;

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
  return status === 'signedIn' ? routes.app.index : routes.auth.welcome;
}

export function resolveUnknownRouteDestination(status: NavigationAccessStatus) {
  return status === 'signedIn' ? routes.app.index : routes.auth.welcome;
}

export function shouldRedirectAuthRoute(status: NavigationAccessStatus, pathname: string): boolean {
  return status === 'signedIn' && signedInRestrictedAuthEntries.has(pathname);
}

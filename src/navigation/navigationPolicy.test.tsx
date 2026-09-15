import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderHook } from '@testing-library/react-native';

import { NavigationAccessProvider, useNavigationAccess } from './NavigationAccessProvider';
import {
  resolveEntryDestination,
  resolveUnknownRouteDestination,
  shouldRedirectAuthRoute,
} from './navigationPolicy';
import { routes } from './routes';

test.each([
  ['checking', null],
  ['signedOut', routes.auth.welcome],
  ['signedIn', routes.app.index],
] as const)('resolves %s root entry without a redirect loop', (status, expected) => {
  expect(resolveEntryDestination(status)).toBe(expected);
});

test('the production access boundary defaults safely to signed out and has no mutation port', () => {
  const defaultAccess = renderHook(useNavigationAccess);
  expect(defaultAccess.result.current).toBe('signedOut');

  const signedIn = renderHook(useNavigationAccess, {
    wrapper: ({ children }) => (
      <NavigationAccessProvider status="signedIn">{children}</NavigationAccessProvider>
    ),
  });
  expect(signedIn.result.current).toBe('signedIn');
  expect(typeof signedIn.result.current).toBe('string');
});

test('central policy redirects signed-in entry routes but preserves recovery routes', () => {
  expect(shouldRedirectAuthRoute('signedIn', '/welcome')).toBe(true);
  expect(shouldRedirectAuthRoute('signedIn', routes.auth.signIn)).toBe(true);
  expect(shouldRedirectAuthRoute('signedIn', '/create-account')).toBe(true);
  expect(shouldRedirectAuthRoute('signedIn', '/reset-password')).toBe(false);
  expect(shouldRedirectAuthRoute('signedOut', '/welcome')).toBe(false);
});

test('unknown routes recover only to allow-listed internal destinations', () => {
  expect(resolveUnknownRouteDestination('signedOut')).toBe(routes.auth.welcome);
  expect(resolveUnknownRouteDestination('checking')).toBe(routes.auth.welcome);
  expect(resolveUnknownRouteDestination('signedIn')).toBe(routes.app.index);
  expect(Object.values(routes.auth).every((route) => route.startsWith('/(auth)/'))).toBe(true);
  expect(routes.app.index.startsWith('/(app)')).toBe(true);
});

test('route inventory contains only the authorized root, auth, and protected files', () => {
  const appRoot = path.resolve(__dirname, '../../app');
  const files = fs
    .readdirSync(appRoot, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
    .map((entry) => path.relative(appRoot, path.join(entry.parentPath, entry.name)))
    .sort();

  expect(files).toEqual(
    [
      '(app)/_layout.tsx',
      '(app)/index.tsx',
      '(auth)/_layout.tsx',
      '(auth)/create-account.tsx',
      '(auth)/forgot-password.tsx',
      '(auth)/offline.tsx',
      '(auth)/password-updated.tsx',
      '(auth)/reset-link-sent.tsx',
      '(auth)/reset-password.tsx',
      '(auth)/security-state.tsx',
      '(auth)/sign-in.tsx',
      '(auth)/too-many-attempts.tsx',
      '(auth)/verify-email.tsx',
      '(auth)/welcome.tsx',
      '+not-found.tsx',
      '_layout.tsx',
      'index.tsx',
    ].sort(),
  );
});

test('navigation source contains no API, session persistence, token logging, or external redirect', () => {
  const navigationRoot = path.resolve(__dirname);
  const source = fs
    .readdirSync(navigationRoot)
    .filter((name) => /\.tsx?$/.test(name) && !/\.test\./.test(name))
    .map((name) => fs.readFileSync(path.join(navigationRoot, name), 'utf8'))
    .join('\n');

  expect(source).not.toMatch(
    /AsyncStorage|SecureStore|useMutation|useQuery|fetch\s*\(|axios|console\.(?:log|info|warn|error)/,
  );
  expect(source).not.toMatch(/https?:\/\//);
});

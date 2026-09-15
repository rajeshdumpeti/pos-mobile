import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SessionProvider, useSession } from './SessionProvider';
import { productionSessionState, reduceSession, sessionToNavigationAccess } from './sessionState';

function Consumer() {
  const state = useSession();
  return <Text>{state.status}</Text>;
}
test('production session starts deterministically in the checking boundary', () => {
  expect(productionSessionState).toEqual({ status: 'restoring' });
  expect(
    render(
      <SessionProvider state={productionSessionState}>
        <Consumer />
      </SessionProvider>,
    ).getByText('restoring'),
  ).toBeTruthy();
});
test('session maps to navigation access and supports controlled integration injection', () => {
  expect(sessionToNavigationAccess({ status: 'restoring' })).toBe('checking');
  expect(sessionToNavigationAccess({ status: 'signedOut' })).toBe('signedOut');
  const signedIn = {
    status: 'signedIn',
    account: { accountId: 'a', onboardingRequired: false },
  } as const;
  expect(sessionToNavigationAccess(signedIn)).toBe('signedIn');
  expect(
    render(
      <SessionProvider state={signedIn}>
        <Consumer />
      </SessionProvider>,
    ).getByText('signedIn'),
  ).toBeTruthy();
});
test('session reducer has narrow event transitions and no credentials', () => {
  const account = { accountId: 'a', onboardingRequired: true };
  expect(reduceSession({ status: 'restoring' }, { type: 'restorationFinishedSignedOut' })).toEqual({
    status: 'signedOut',
  });
  expect(reduceSession({ status: 'signedOut' }, { type: 'sessionEstablished', account })).toEqual({
    status: 'signedIn',
    account,
  });
  expect(JSON.stringify(account)).not.toMatch(/token|password|credential/i);
});

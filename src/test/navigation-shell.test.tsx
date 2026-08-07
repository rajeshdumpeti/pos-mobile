import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@/providers/AppProviders', () => ({
  AppProviders: ({ children }: React.PropsWithChildren) => children,
}));

jest.mock('expo-router', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { Text: MockText } = jest.requireActual<typeof import('react-native')>('react-native');
  const Stack = ({ children }: React.PropsWithChildren) => children;
  Stack.Screen = ({ name }: { name?: string }) =>
    ReactModule.createElement(MockText, null, `screen:${name ?? 'configured'}`);
  return {
    Stack,
    Redirect: ({ href }: { href: string }) =>
      ReactModule.createElement(MockText, { testID: 'redirect-target' }, href),
    Link: ({ children, href }: React.PropsWithChildren<{ href: string }>) =>
      ReactModule.createElement(
        MockText,
        { accessibilityRole: 'link', accessibilityHint: href },
        children,
      ),
  };
});

import NotFoundRoute from '../../app/+not-found';
import RootLayout from '../../app/_layout';
import IndexRoute from '../../app/index';

test('root route redirects to the intended POS application shell', () => {
  const view = render(<IndexRoute />);
  expect(view.getByTestId('redirect-target').props.children).toBe('/(app)/(tabs)');
});

test('root navigation composes the application, auth, modal, and not-found shells', () => {
  const view = render(<RootLayout />);
  expect(view.getByText('screen:(app)')).toBeTruthy();
  expect(view.getByText('screen:(auth)')).toBeTruthy();
  expect(view.getByText('screen:modal')).toBeTruthy();
  expect(view.getByText('screen:+not-found')).toBeTruthy();
});

test('not-found route gives an accessible way back to POS', () => {
  const view = render(<NotFoundRoute />);
  expect(view.getByRole('header', { name: 'This page is unavailable' })).toBeTruthy();
  expect(view.getByRole('link', { name: 'Return to POS' }).props.accessibilityHint).toBe(
    '/(app)/(tabs)',
  );
});

import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('@/providers/AppProviders', () => ({
  AppProviders: ({ children }: React.PropsWithChildren) => children,
}));

jest.mock('@/design-system/theme', () => {
  const actual =
    jest.requireActual<typeof import('@/design-system/theme')>('@/design-system/theme');
  return { ...actual, useTheme: () => actual.createTheme('light') };
});

jest.mock('@/features/foundation/FoundationScreen', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { Text: MockText } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    FoundationScreen: () => ReactModule.createElement(MockText, null, 'temporary foundation'),
  };
});

jest.mock('expo-router', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { Text: MockText } = jest.requireActual<typeof import('react-native')>('react-native');
  const Stack = ({ children }: React.PropsWithChildren) => children;
  Stack.Screen = ({ name }: { name?: string }) =>
    ReactModule.createElement(MockText, null, `screen:${name ?? 'configured'}`);
  return {
    Stack,
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

test('root route renders the temporary foundation', () => {
  const view = render(<IndexRoute />);
  expect(view.getByText('temporary foundation')).toBeTruthy();
});

test('root navigation contains only the foundation and not-found routes', () => {
  const view = render(<RootLayout />);
  expect(view.getByText('screen:index')).toBeTruthy();
  expect(view.getByText('screen:+not-found')).toBeTruthy();
  expect(view.queryByText(/screen:\((app|auth)\)|screen:modal/)).toBeNull();
});

test('not-found route gives an accessible way back to the foundation', () => {
  const view = render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <NotFoundRoute />
    </SafeAreaProvider>,
  );
  expect(view.getByRole('header', { name: 'This page is unavailable' })).toBeTruthy();
  expect(
    view.getByRole('link', { name: 'Return to the POS foundation' }).props.accessibilityHint,
  ).toBe('/');
});

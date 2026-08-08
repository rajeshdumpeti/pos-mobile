import { render } from '@testing-library/react-native';

import { ThemeProvider } from '@/design-system/theme';

import { POSIcon, POSIconName } from './POSIcon';

test('uses a controlled mapped icon and accessible label', () => {
  const view = render(
    <ThemeProvider preference="light">
      <POSIcon name="search" accessibilityLabel="Search" testID="icon" />
    </ThemeProvider>,
  );
  expect(view.getByTestId('icon').props.name).toBe('search-outline');
  expect(view.getByLabelText('Search')).toBeTruthy();
});

test('safely falls back if an unsupported name arrives at runtime', () => {
  const view = render(
    <ThemeProvider preference="light">
      <POSIcon
        name={'unsupported' as POSIconName}
        accessibilityLabel="Unknown icon"
        testID="icon"
      />
    </ThemeProvider>,
  );
  expect(view.getByTestId('icon').props.name).toBe('help-circle-outline');
});

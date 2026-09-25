import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme';
import { GoalsFields } from './GoalsFields';

test('renders only configured goals with accessible units and reports edits', () => {
  const onChange = jest.fn();
  const view = render(
    <ThemeProvider preference="dark">
      <GoalsFields
        supported={['target_weight', 'workouts_per_week']}
        draft={{ target_weight: '72.5' }}
        errors={{}}
        unit="metric"
        currency="USD"
        disabled={false}
        onChange={onChange}
      />
    </ThemeProvider>,
  );
  expect(view.getByLabelText('Target weight').props.value).toBe('72.5');
  expect(view.getByText('kg · Optional')).toBeTruthy();
  expect(view.getByLabelText('Workouts per week')).toBeTruthy();
  expect(view.queryByLabelText('Daily steps')).toBeNull();
  fireEvent.changeText(view.getByLabelText('Target weight'), '73.0');
  expect(onChange).toHaveBeenCalledWith('target_weight', '73.0');
});

test('exposes fixed validation errors as accessible alerts and disables inputs', () => {
  const view = render(
    <ThemeProvider preference="light">
      <GoalsFields
        supported={['daily_steps']}
        draft={{ daily_steps: '-1' }}
        errors={{ daily_steps: 'Enter a value from 1 to 100000000.' }}
        unit="imperial"
        currency="USD"
        disabled
        onChange={jest.fn()}
      />
    </ThemeProvider>,
  );
  expect(view.getByRole('alert')).toHaveTextContent('Error: Enter a value from 1 to 100000000.');
  expect(view.getByLabelText('Daily steps').props.editable).toBe(false);
});

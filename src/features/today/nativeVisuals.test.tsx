import { render } from '@testing-library/react-native';
import { UIManager } from 'react-native';
import { ThemeProvider } from '@/design-system/theme';
import { ContextIllustration } from './TodayVisuals';
import { supportsNativeSvg } from './nativeVisuals';

const mockSvg = jest.fn();
jest.mock('react-native-svg', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: (props: object) => {
      mockSvg(props);
      return null;
    },
    Circle: View,
    Rect: View,
    Path: View,
    Ellipse: View,
    G: View,
    Defs: View,
    LinearGradient: View,
    Stop: View,
  };
});
afterEach(() => {
  jest.restoreAllMocks();
  mockSvg.mockClear();
});
test('missing native SVG views use supported decorative icons instead of an unimplemented component', () => {
  jest.spyOn(UIManager, 'hasViewManagerConfig').mockReturnValue(false);
  render(
    <ThemeProvider preference="light">
      <ContextIllustration kind="complete" />
    </ThemeProvider>,
  );
  expect(supportsNativeSvg()).toBe(false);
  expect(mockSvg).not.toHaveBeenCalled();
});
test('available native SVG views retain the contextual vector artwork', () => {
  jest.spyOn(UIManager, 'hasViewManagerConfig').mockReturnValue(true);
  render(
    <ThemeProvider preference="light">
      <ContextIllustration kind="scheduled" />
    </ThemeProvider>,
  );
  expect(mockSvg).toHaveBeenCalled();
});

import { Platform, UIManager, TurboModuleRegistry } from 'react-native';

export function supportsNativePicker(mode: 'date' | 'time') {
  if (Platform.OS === 'ios') return UIManager.hasViewManagerConfig('RNDateTimePicker');
  if (Platform.OS === 'android')
    return TurboModuleRegistry.get(mode === 'date' ? 'RNCDatePicker' : 'RNCTimePicker') !== null;
  return false;
}

/** An installed JS package does not guarantee that the running client contains its views. */
export function supportsNativeSvg() {
  return (
    Platform.OS === 'web' ||
    UIManager.hasViewManagerConfig(
      Platform.OS === 'android' ? 'RNSVGSvgViewAndroid' : 'RNSVGSvgView',
    )
  );
}

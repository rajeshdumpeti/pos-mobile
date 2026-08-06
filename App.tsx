import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppProvider } from './src/store/AppStore';
import { darkColors, lightColors } from './src/theme';
import { LaunchFlow } from './src/screens/LaunchFlow';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  const dark = useColorScheme() === 'dark';
  const [launched, setLaunched] = useState(false);
  const base = dark ? DarkTheme : DefaultTheme;
  if (!launched) return <SafeAreaProvider><LaunchFlow onComplete={() => setLaunched(true)} /></SafeAreaProvider>;
  const colors = dark ? darkColors : lightColors;
  return (
    <SafeAreaProvider><AppProvider>
      <NavigationContainer theme={{ ...base, colors: { ...base.colors, primary: colors.action.primary, background: colors.background.primary, card: colors.surface.primary, text: colors.text.primary, border: colors.border.default } }}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <AppNavigator />
      </NavigationContainer>
    </AppProvider></SafeAreaProvider>
  );
}

import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: true }} />
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>
          This page is unavailable
        </Text>
        <Link href="/(app)/(tabs)" accessibilityRole="link" style={styles.link}>
          Return to POS
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  title: { fontSize: 22, fontWeight: '700' },
  link: { minHeight: 44, padding: 12, color: '#315F4A', fontWeight: '700' },
});

import { Tabs } from 'expo-router';
import { ShellTabBar } from '@/features/app-shell/ShellTabBar';
export default function ShellTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <ShellTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
      <Tabs.Screen name="focus" options={{ title: 'Focus' }} />
      <Tabs.Screen name="review" options={{ title: 'Review' }} />
    </Tabs>
  );
}

import { useLocalSearchParams } from 'expo-router';

import {
  MoneyScreen,
  NotificationsScreen,
  NutritionScreen,
  ProfileScreen,
  QuickAddScreen,
  SearchScreen,
  SettingsScreen,
  TimelineScreen,
  WeightScreen,
  WorkoutScreen,
} from '@/screens/DetailScreens';
import {
  FocusScreen,
  LogScreen,
  PlanScreen,
  ReviewScreen,
  TodayScreen,
} from '@/screens/MainScreens';

import { usePrototypeNavigation } from './usePrototypeNavigation';

type ScreenName =
  | 'today'
  | 'plan'
  | 'log'
  | 'focus'
  | 'review'
  | 'timeline'
  | 'nutrition'
  | 'weight'
  | 'workout'
  | 'money'
  | 'notifications'
  | 'search'
  | 'profile'
  | 'settings'
  | 'quick-add';

export function PrototypeRouteScreen({ name }: { name: ScreenName }) {
  const navigation = usePrototypeNavigation();
  const { type } = useLocalSearchParams<{ type?: string }>();

  switch (name) {
    case 'today':
      return <TodayScreen navigation={navigation} />;
    case 'plan':
      return <PlanScreen navigation={navigation} />;
    case 'log':
      return <LogScreen navigation={navigation} />;
    case 'focus':
      return <FocusScreen />;
    case 'review':
      return <ReviewScreen />;
    case 'timeline':
      return <TimelineScreen navigation={navigation} />;
    case 'nutrition':
      return <NutritionScreen navigation={navigation} />;
    case 'weight':
      return <WeightScreen navigation={navigation} />;
    case 'workout':
      return <WorkoutScreen navigation={navigation} />;
    case 'money':
      return <MoneyScreen navigation={navigation} />;
    case 'notifications':
      return <NotificationsScreen navigation={navigation} />;
    case 'search':
      return <SearchScreen navigation={navigation} />;
    case 'profile':
      return <ProfileScreen navigation={navigation} />;
    case 'settings':
      return <SettingsScreen navigation={navigation} />;
    case 'quick-add': {
      const validType =
        type === 'task' || type === 'meal' || type === 'transaction' ? type : undefined;
      return (
        <QuickAddScreen
          navigation={navigation}
          route={{ params: validType ? { type: validType } : undefined }}
        />
      );
    }
  }
}

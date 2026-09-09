import { Redirect } from 'expo-router';
import {
  NavigationRestoringScreen,
  resolveEntryDestination,
  useNavigationAccess,
} from '@/navigation';

export default function IndexRoute() {
  const destination = resolveEntryDestination(useNavigationAccess());
  return destination ? <Redirect href={destination} /> : <NavigationRestoringScreen />;
}

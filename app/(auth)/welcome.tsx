import { WelcomeScreen } from '@/features/authentication/screens';
import { useAuthRouteNavigation } from '@/features/authentication/hooks/useAuthRouteNavigation';

export default function WelcomeRoute() {
  const { onNavigate } = useAuthRouteNavigation();
  return <WelcomeScreen onNavigate={onNavigate} />;
}

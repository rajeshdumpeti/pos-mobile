import { useAuthRouteNavigation } from '@/features/authentication/hooks/useAuthRouteNavigation';
import { SignInScreen } from '@/features/authentication/screens';

export default function SignInRoute() {
  const { onNavigate, onBack } = useAuthRouteNavigation();
  return <SignInScreen onNavigate={onNavigate} onBack={onBack} />;
}

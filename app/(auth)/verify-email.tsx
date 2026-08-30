import { useAuthRouteNavigation } from '@/features/authentication/hooks/useAuthRouteNavigation';
import { VerifyEmailScreen } from '@/features/authentication/screens';

export default function VerifyEmailRoute() {
  const { onNavigate, onBack } = useAuthRouteNavigation();
  return <VerifyEmailScreen onNavigate={onNavigate} onBack={onBack} />;
}

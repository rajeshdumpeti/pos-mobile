import { useAuthRouteNavigation } from '@/features/authentication/hooks/useAuthRouteNavigation';
import { ForgotPasswordScreen } from '@/features/authentication/screens';

export default function ForgotPasswordRoute() {
  const { onNavigate, onBack } = useAuthRouteNavigation();
  return <ForgotPasswordScreen onNavigate={onNavigate} onBack={onBack} />;
}

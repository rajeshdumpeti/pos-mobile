import { useAuthRouteNavigation } from '@/features/authentication/hooks/useAuthRouteNavigation';
import { ResetPasswordScreen } from '@/features/authentication/screens';

export default function ResetPasswordRoute() {
  const { onNavigate, onBack } = useAuthRouteNavigation();
  return <ResetPasswordScreen onNavigate={onNavigate} onBack={onBack} />;
}

import { useAuthRouteNavigation } from '@/features/authentication/hooks/useAuthRouteNavigation';
import { BiometricSetupScreen } from '@/features/authentication/screens';

export default function BiometricSetupRoute() {
  const { onNavigate, onBack } = useAuthRouteNavigation();
  return <BiometricSetupScreen onNavigate={onNavigate} onBack={onBack} />;
}

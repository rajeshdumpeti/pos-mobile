import { useAuthRouteNavigation } from '@/features/authentication/hooks/useAuthRouteNavigation';
import { CreateAccountScreen } from '@/features/authentication/screens';

export default function CreateAccountRoute() {
  const { onNavigate, onBack } = useAuthRouteNavigation();
  return <CreateAccountScreen onNavigate={onNavigate} onBack={onBack} />;
}

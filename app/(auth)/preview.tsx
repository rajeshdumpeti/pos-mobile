import { useAuthRouteNavigation } from '@/features/authentication/hooks/useAuthRouteNavigation';
import { AuthStatePreviewScreen } from '@/features/authentication/screens';

export default function AuthStatePreviewRoute() {
  const { onNavigate, onBack } = useAuthRouteNavigation();
  return <AuthStatePreviewScreen onNavigate={onNavigate} onBack={onBack} />;
}

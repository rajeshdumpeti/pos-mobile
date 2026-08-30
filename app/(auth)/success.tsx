import { useAuthRouteNavigation } from '@/features/authentication/hooks/useAuthRouteNavigation';
import { SuccessScreen } from '@/features/authentication/screens';

export default function SuccessRoute() {
  const { onContinueToPOS } = useAuthRouteNavigation();
  return <SuccessScreen onContinue={onContinueToPOS} />;
}

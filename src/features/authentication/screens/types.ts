import { AuthRoutePath } from '@/features/authentication/constants/authentication';

export type AuthScreenNavigation = {
  onNavigate: (path: AuthRoutePath) => void;
  onBack?: () => void;
};

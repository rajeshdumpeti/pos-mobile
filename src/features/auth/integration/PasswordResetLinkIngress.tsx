import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { routes } from '@/navigation/routes';
import { useAuthenticationCapabilities } from './AuthenticationIntegrationProvider';
import { parsePasswordResetLink } from './passwordResetLink';

export function PasswordResetLinkIngress() {
  const router = useRouter();
  const { passwordRecovery } = useAuthenticationCapabilities();

  useEffect(() => {
    let active = true;
    const ingest = (incomingUrl: string | null) => {
      if (!active || !incomingUrl) return;
      const result = parsePasswordResetLink(incomingUrl);
      if (!result.accepted) return;
      if (passwordRecovery.acceptToken(result.token)) {
        // Replacement removes the credential-bearing external route from app navigation state.
        router.replace(routes.auth.resetPassword);
      }
    };
    void Linking.getInitialURL()
      .then(ingest)
      .catch(() => undefined);
    const subscription = Linking.addEventListener('url', ({ url }) => ingest(url));
    return () => {
      active = false;
      subscription.remove();
    };
  }, [passwordRecovery, router]);
  return null;
}

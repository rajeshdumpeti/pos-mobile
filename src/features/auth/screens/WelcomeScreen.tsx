import { useRouter } from 'expo-router';
import { AppText } from '@/design-system';
import { routes } from '@/navigation/routes';
import { AuthScaffold } from '../components/AuthScaffold';
import { AuthAction } from '../components/AuthAction';

export function WelcomeScreen() {
  const router = useRouter();
  return (
    <AuthScaffold
      welcome
      title="Welcome Back"
      subtitle="A little clarity. A little momentum. Your journey continues here."
      illustration="welcome"
      footer={
        <>
          <AuthAction label="Continue with Email" onPress={() => router.push(routes.auth.signIn)} />
          <AppText variant="caption" color="secondary" style={{ textAlign: 'center' }}>
            New to POS?
          </AppText>
          <AuthAction
            label="Create Account"
            variant="secondary"
            onPress={() => router.push(routes.auth.createAccount)}
          />
        </>
      }
    />
  );
}

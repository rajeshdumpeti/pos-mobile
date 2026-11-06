import { Slot } from 'expo-router';
import { OnboardingBoundary } from '@/navigation';

export default function OnboardingLayout() {
  return (
    <OnboardingBoundary>
      <Slot />
    </OnboardingBoundary>
  );
}

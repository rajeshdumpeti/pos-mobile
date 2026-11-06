import { planContext } from '@/features/plan/calendar';
import { useLocalSearchParams } from 'expo-router';
import { PlanItemFormScreen } from '@/features/today/PlanItemFormScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
export default function CreatePlanItem() {
  const params = useLocalSearchParams();
  const context = planContext(params.origin, params.selectedDate);
  return (
    <SafeAreaProvider>
      <PlanItemFormScreen context={context} />
    </SafeAreaProvider>
  );
}

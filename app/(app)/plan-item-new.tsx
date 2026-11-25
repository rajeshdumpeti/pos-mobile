import { planContext } from '@/features/plan/calendar';
import { useLocalSearchParams } from 'expo-router';
import { PlanItemFormScreen } from '@/features/today/PlanItemFormScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
export default function CreatePlanItem() {
  const params = useLocalSearchParams();
  const context = planContext(params.origin, params.selectedDate);
  // Content-free origin marker for the create request header; anything else is manual.
  const entrySource = params.entry === 'quick_log' ? 'quick_log' : 'manual';
  return (
    <SafeAreaProvider>
      <PlanItemFormScreen context={context} entrySource={entrySource} />
    </SafeAreaProvider>
  );
}

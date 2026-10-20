import { planContext } from '@/features/plan/calendar';
import { useLocalSearchParams } from 'expo-router';
import { PlanItemFormScreen } from '@/features/today/PlanItemFormScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
export default function EditPlanItem() {
  const { id, origin, selectedDate } = useLocalSearchParams();
  const context = planContext(origin, selectedDate);
  return (
    <SafeAreaProvider>
      <PlanItemFormScreen mode="edit" id={id} context={context} />
    </SafeAreaProvider>
  );
}

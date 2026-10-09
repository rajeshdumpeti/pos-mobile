import { PlanItemFormScreen } from '@/features/today/PlanItemFormScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
export default function CreatePlanItem() {
  return (
    <SafeAreaProvider>
      <PlanItemFormScreen />
    </SafeAreaProvider>
  );
}

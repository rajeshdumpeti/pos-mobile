import { useLocalSearchParams } from 'expo-router';
import { PlanItemFormScreen } from '@/features/today/PlanItemFormScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
export default function EditPlanItem() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  return (
    <SafeAreaProvider>
      <PlanItemFormScreen mode="edit" id={id} />
    </SafeAreaProvider>
  );
}

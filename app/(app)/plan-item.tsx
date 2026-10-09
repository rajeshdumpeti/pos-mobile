import { useLocalSearchParams } from 'expo-router';
import { PlanItemDetailScreen } from '@/features/today/PlanItemDetailScreen';
export default function PlanItem() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  return <PlanItemDetailScreen id={id} />;
}

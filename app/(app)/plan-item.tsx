import { planContext } from '@/features/plan/calendar';
import { useLocalSearchParams } from 'expo-router';
import { PlanItemDetailScreen } from '@/features/today/PlanItemDetailScreen';
export default function PlanItem() {
  const { id, origin, selectedDate } = useLocalSearchParams();
  const context = planContext(origin, selectedDate);
  return <PlanItemDetailScreen id={id} context={context} />;
}

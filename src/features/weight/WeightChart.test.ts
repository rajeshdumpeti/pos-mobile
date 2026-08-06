import { transformWeightData } from './WeightChart';
test('maps recorded weights into an ordered line plot', () => {
  const result = transformWeightData([{ date: '1', label: 'Mon', value: 172 }, { date: '2', label: 'Tue', value: 171.2 }], 200, 100);
  expect(result.points).toHaveLength(2);
  expect(result.points[0]?.x).toBe(0);
  expect(result.points[1]?.x).toBe(200);
  expect((result.points[1]?.y ?? 0)).toBeGreaterThan(result.points[0]?.y ?? 0);
});

import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { POSCard } from '../../components/ui';
import { spacing, typography, usePOSTheme } from '../../theme';

export type WeightEntry = { date: string; label: string; value: number };
export type ChartPoint = WeightEntry & { x: number; y: number };
export function transformWeightData(entries: WeightEntry[], width: number, height: number): { points: ChartPoint[]; min: number; max: number } {
  if (!entries.length) return { points: [], min: 0, max: 0 };
  const values = entries.map(e => e.value); const rawMin = Math.min(...values); const rawMax = Math.max(...values); const padding = Math.max(.2, (rawMax - rawMin) * .2); const min = rawMin - padding; const max = rawMax + padding; const range = max - min || 1;
  return { min, max, points: entries.map((entry, index) => ({ ...entry, x: entries.length === 1 ? width / 2 : index * width / (entries.length - 1), y: height - ((entry.value - min) / range) * height })) };
}
export function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const { colors } = usePOSTheme(); const [width, setWidth] = useState(280); const height = 132; const { points, min, max } = transformWeightData(entries, Math.max(1, width - 16), height - 16);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const first = entries[0]; const last = entries[entries.length - 1]; const summary = first && last ? `Weight ${last.value <= first.value ? 'decreased' : 'increased'} from ${first.value.toFixed(1)} pounds to ${last.value.toFixed(1)} pounds over ${entries.length} days.` : 'No weight history available.';
  return <POSCard><View accessible accessibilityRole="image" accessibilityLabel={summary} onLayout={onLayout} style={chart.chart}>
    <View style={chart.scale}><Text style={[chart.scaleText, { color: colors.text.muted }]}>{max.toFixed(1)}</Text><Text style={[chart.scaleText, { color: colors.text.muted }]}>{min.toFixed(1)}</Text></View>
    <View style={[chart.plot, { borderColor: colors.border.default }]}>{points.slice(0, -1).map((point, index) => { const next = points[index + 1]; if (!next) return null; const dx = next.x - point.x; const dy = next.y - point.y; const length = Math.sqrt(dx * dx + dy * dy); const angle = Math.atan2(dy, dx); return <View key={`line-${point.date}`} style={[chart.line, { width: length, left: point.x + 8, top: point.y + 8, backgroundColor: colors.progress.fill, transform: [{ rotateZ: `${angle}rad` }] }]} />; })}{points.map(point => <View key={point.date} style={[chart.point, { left: point.x + 4, top: point.y + 4, backgroundColor: colors.surface.primary, borderColor: colors.progress.fill }]} />)}</View>
  </View><View style={chart.labels}>{entries.map(entry => <Text key={entry.date} style={[chart.label, { color: colors.text.muted }]}>{entry.label}</Text>)}</View><Text style={[typography.secondary, { color: colors.text.secondary }]}>{summary}</Text></POSCard>;
}
const chart = StyleSheet.create({ chart: { height: 148, flexDirection: 'row' }, scale: { width: 42, justifyContent: 'space-between', paddingVertical: 2 }, scaleText: { ...typography.caption, fontVariant: ['tabular-nums'] }, plot: { flex: 1, height: 132, borderBottomWidth: StyleSheet.hairlineWidth, borderTopWidth: StyleSheet.hairlineWidth, position: 'relative', overflow: 'hidden' }, line: { position: 'absolute', height: 2, transformOrigin: 'left center' }, point: { position: 'absolute', width: 10, height: 10, borderRadius: 5, borderWidth: 2 }, labels: { marginLeft: 42, flexDirection: 'row', justifyContent: 'space-between', marginTop: -spacing.xs }, label: typography.caption });

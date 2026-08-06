import React, { useEffect, useReducer } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { ActiveSessionCapsule, ChecklistRow, POSCard, PrimaryButton, ProgressBar, ScreenContainer, SecondaryButton, SectionHeader, StateBanner, TabScreenHeader, TertiaryButton, MetricBlock } from '../components/ui';
import { focusReducer, formatFocusTime, initialFocusState } from '../features/focus/focusMachine';
import { useApp } from '../store/AppStore';
import { radius, spacing, typography, usePOSTheme } from '../theme';

type Navigation = { navigate: (name: string, params?: { type?: string }) => void };
type ScreenProps = { navigation: Navigation };

export function TodayScreen({ navigation }: ScreenProps) {
  const { data, offline, toggle } = useApp(); const { colors } = usePOSTheme();
  return <ScreenContainer tabScreen><TabScreenHeader eyebrow="Saturday, July 25" title={`Good morning, ${data.user.name}`} actions={[{ icon: 'search-outline', label: 'Search', onPress: () => navigation.navigate('Search') }, { icon: 'notifications-outline', label: 'Notifications', onPress: () => navigation.navigate('Notifications') }]} />
    {offline ? <StateBanner kind="offline" message="Offline · changes stay on this device" /> : null}
    <POSCard style={{ padding: spacing.xl, backgroundColor: colors.action.secondary }}><Text style={[styles.kicker, { color: colors.action.primary }]}>NEXT BEST ACTION</Text><Text style={[styles.heroTitle, { color: colors.text.primary }]}>Finish breakfast, then head to the office.</Text><Text style={[typography.secondary, { color: colors.text.secondary }]}>Your morning is on track. Office starts at 9:00 AM.</Text></POSCard>
    <SectionHeader title="Top priorities" /><POSCard>{data.priorities.map(item => <ChecklistRow key={item.id} item={item} onPress={() => toggle('priorities', item.id)} />)}</POSCard>
    <View style={styles.metrics}><POSCard style={styles.half}><MetricBlock value="3/9" label="Routine" /><ProgressBar value={33} accessibilityLabel="Routine progress, 3 of 9 complete" /></POSCard><POSCard style={styles.half}><MetricBlock value="1.2" unit="L" label="Water · 3.0 L" /><ProgressBar value={40} accessibilityLabel="Water progress, 1.2 of 3 liters" /></POSCard></View>
    <POSCard><SectionHeader title="Today at a glance" /><View style={styles.metrics}><MetricBlock value="1,040" unit="kcal" label="Nutrition" /><MetricBlock value="76" unit="g" label="Protein" /><MetricBlock value="$51" label="Spent" /></View></POSCard>
    <POSCard><SectionHeader title="Up next" />{data.timeline.slice(3, 6).map(item => <ChecklistRow key={item.id} item={item} onPress={() => toggle('timeline', item.id)} />)}<SecondaryButton title="Open timeline" onPress={() => navigation.navigate('Timeline')} /></POSCard>
    <PrimaryButton title="Quick add" onPress={() => navigation.navigate('QuickAdd')} />
  </ScreenContainer>;
}

export function PlanScreen({ navigation }: ScreenProps) {
  const { data, toggle } = useApp(); const { colors } = usePOSTheme();
  return <ScreenContainer tabScreen><TabScreenHeader eyebrow="Your day" title="Plan" actions={[{ icon: 'search-outline', label: 'Search', onPress: () => navigation.navigate('Search') }]} />
    <View accessibilityRole="tablist" style={[styles.segment, { backgroundColor: colors.background.secondary }]}><View accessibilityRole="tab" accessibilityState={{ selected: true }} style={[styles.segmentItem, { backgroundColor: colors.surface.primary }]}><Text style={[typography.buttonLabel, { color: colors.action.primary }]}>Tasks</Text></View><Pressable accessibilityRole="tab" accessibilityState={{ selected: false }} onPress={() => navigation.navigate('Timeline')} style={styles.segmentItem}><Text style={[typography.buttonLabel, { color: colors.text.muted }]}>Timeline</Text></Pressable></View>
    <SectionHeader title={`Today · ${data.tasks.length}`} /><POSCard>{data.tasks.length ? data.tasks.map(item => <ChecklistRow key={item.id} item={item} onPress={() => toggle('tasks', item.id)} />) : <Text style={[typography.secondary, { color: colors.text.muted }]}>Nothing planned yet. Add one useful next step.</Text>}</POSCard>
    <PrimaryButton title="Add task" onPress={() => navigation.navigate('QuickAdd', { type: 'task' })} />
  </ScreenContainer>;
}

export function LogScreen({ navigation }: ScreenProps) {
  const { colors } = usePOSTheme(); return <ScreenContainer tabScreen><TabScreenHeader eyebrow="Daily tracking" title="Log" actions={[{ icon: 'search-outline', label: 'Search', onPress: () => navigation.navigate('Search') }]} />
    <DomainCard title="Nutrition" action="Open nutrition" onPress={() => navigation.navigate('Nutrition')}><View style={styles.metrics}><MetricBlock value="1,040" unit="kcal" label="of 2,200" /><MetricBlock value="76" unit="g" label="of 150 protein" /></View><ProgressBar value={48} accessibilityLabel="Nutrition progress, 1,040 of 2,200 calories" /></DomainCard>
    <DomainCard title="Weight" action="View trend" onPress={() => navigation.navigate('Weight')}><View style={styles.metrics}><MetricBlock value="171.2" unit="lb" label="Current" /><MetricBlock value="−0.8" unit="lb" label="This week" /></View></DomainCard>
    <DomainCard title="Workout" action="Start workout" onPress={() => navigation.navigate('Workout')}><Text style={[styles.heroTitle, { color: colors.text.primary }]}>Chest and Triceps</Text><Text style={[typography.secondary, { color: colors.text.muted }]}>5 exercises · about 55 minutes</Text></DomainCard>
    <DomainCard title="Money" action="Open money" onPress={() => navigation.navigate('Money')}><View style={styles.metrics}><MetricBlock value="$51" label="Spent today" /><MetricBlock value="$1,102" label="Budget remaining" /></View></DomainCard>
  </ScreenContainer>;
}
function DomainCard({ title, action, onPress, children }: React.PropsWithChildren<{ title: string; action: string; onPress: () => void }>) { return <POSCard><SectionHeader title={title} />{children}<SecondaryButton title={action} onPress={onPress} /></POSCard>; }

export function FocusScreen() {
  const { colors } = usePOSTheme(); const [state, dispatch] = useReducer(focusReducer, initialFocusState); const time = formatFocusTime(state.remainingSeconds);
  useEffect(() => { if (state.phase !== 'running') return; const tick = () => dispatch({ type: 'tick', now: Date.now() }); tick(); const timer = setInterval(tick, 1000); const subscription = AppState.addEventListener('change', next => { if (next === 'active') tick(); }); return () => { clearInterval(timer); subscription.remove(); }; }, [state.phase, state.endsAt]);
  return <ScreenContainer tabScreen><TabScreenHeader eyebrow="Deep work" title="Focus" />
    {state.phase === 'idle' ? <POSCard style={styles.focus}><Text style={[typography.cardTitle, { color: colors.text.primary, textAlign: 'center' }]}>Finish React feature</Text><Text style={[typography.secondary, { color: colors.text.muted, textAlign: 'center' }]}>Linked task · Today</Text><View style={styles.durationRow}>{[15, 25, 50].map(minutes => <Pressable key={minutes} accessibilityRole="radio" accessibilityState={{ selected: state.durationSeconds === minutes * 60 }} onPress={() => dispatch({ type: 'selectDuration', seconds: minutes * 60 })} style={[styles.duration, { borderColor: state.durationSeconds === minutes * 60 ? colors.action.primary : colors.border.default, backgroundColor: state.durationSeconds === minutes * 60 ? colors.action.secondary : colors.surface.primary }]}><Text style={[typography.buttonLabel, { color: state.durationSeconds === minutes * 60 ? colors.action.primary : colors.text.secondary }]}>{minutes} min</Text></Pressable>)}</View><PrimaryButton title="Start Focus" onPress={() => dispatch({ type: 'start', now: Date.now() })} /></POSCard> : null}
    {state.phase === 'running' || state.phase === 'paused' ? <><ActiveSessionCapsule label={state.phase === 'running' ? 'Focus in progress' : 'Focus paused'} value={time} onPress={() => undefined} /><POSCard style={styles.focus}><Text style={[typography.cardTitle, { color: colors.text.primary, textAlign: 'center' }]}>Finish React feature</Text><Text accessibilityLabel={`${time} remaining`} accessibilityLiveRegion="polite" style={[styles.timer, { color: colors.text.primary }]}>{time}</Text><PrimaryButton title={state.phase === 'running' ? 'Pause' : 'Resume'} onPress={() => dispatch(state.phase === 'running' ? { type: 'pause', now: Date.now() } : { type: 'resume', now: Date.now() })} /><View style={styles.actionRow}><SecondaryButton title="Extend 5 min" onPress={() => dispatch({ type: 'extend', seconds: 300, now: Date.now() })} /><SecondaryButton title="Complete" onPress={() => dispatch({ type: 'complete' })} /></View><TertiaryButton title="Cancel session" onPress={() => dispatch({ type: 'cancel' })} /></POSCard></> : null}
    {state.phase === 'completed' ? <POSCard style={styles.focus}><Text style={[typography.screenTitle, { color: colors.text.primary, textAlign: 'center' }]}>Focus complete</Text><Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center' }]}>You gave this task your full attention. This session is saved locally.</Text><MetricBlock value={String(Math.round((state.durationSeconds - state.remainingSeconds) / 60) || Math.round(state.durationSeconds / 60))} unit="min" label="Session length" /><PrimaryButton title="Done" onPress={() => dispatch({ type: 'done' })} /></POSCard> : null}
    <POSCard><SectionHeader title="Today" /><View style={styles.metrics}><MetricBlock value="52" unit="min" label="Focus time" /><MetricBlock value="2" label="Sessions" /></View></POSCard>
    <SectionHeader title="Recent sessions" /><POSCard><Text style={[styles.listText, { color: colors.text.primary, borderColor: colors.border.default }]}>Plan component architecture · 27 min</Text><Text style={[styles.listText, { color: colors.text.primary, borderColor: colors.border.default }]}>Weekly planning · 25 min</Text></POSCard>
  </ScreenContainer>;
}

export function ReviewScreen() {
  const { colors } = usePOSTheme(); return <ScreenContainer tabScreen><TabScreenHeader eyebrow="July 20–26" title="Weekly review" />
    <POSCard style={{ padding: spacing.xl, backgroundColor: colors.action.secondary }}><Text style={[styles.kicker, { color: colors.action.primary }]}>YOUR WEEK</Text><Text style={[styles.heroTitle, { color: colors.text.primary }]}>Consistency was strongest in routines.</Text><Text style={[typography.secondary, { color: colors.text.secondary }]}>Protein was below your selected target on three days. You completed four of five planned workouts.</Text></POSCard>
    <View style={styles.metrics}><POSCard style={styles.half}><MetricBlock value="82%" label="Routines" /><ProgressBar value={82} accessibilityLabel="Routine completion, 82 percent" /></POSCard><POSCard style={styles.half}><MetricBlock value="4/5" label="Workouts" /><ProgressBar value={80} accessibilityLabel="Workout completion, 4 of 5" /></POSCard></View>
    <POSCard><SectionHeader title="Daily averages" /><View style={styles.metrics}><MetricBlock value="2,080" unit="kcal" label="Calories" /><MetricBlock value="132" unit="g" label="Protein" /><MetricBlock value="2.6" unit="L" label="Water" /></View></POSCard>
    <POSCard><SectionHeader title="Life at a glance" /><View style={styles.metrics}><MetricBlock value="−0.8" unit="lb" label="Weight trend" /><MetricBlock value="$348" label="Spent" /><MetricBlock value="4h 18m" label="Focus" /></View><Text style={[typography.secondary, { color: colors.text.muted }]}>23 tasks completed · 4 carried forward</Text></POSCard>
  </ScreenContainer>;
}

const styles = StyleSheet.create({ kicker: { ...typography.caption, letterSpacing: 1.2 }, heroTitle: { fontSize: 20, lineHeight: 27, fontWeight: '700' }, metrics: { flexDirection: 'row', gap: spacing.sm }, half: { flex: 1 }, segment: { flexDirection: 'row', borderRadius: radius.small, padding: spacing.xxs }, segmentItem: { flex: 1, minHeight: 44, borderRadius: radius.small, alignItems: 'center', justifyContent: 'center' }, focus: { padding: spacing.xl, gap: spacing.md }, timer: { fontSize: 68, lineHeight: 78, textAlign: 'center', fontWeight: '300', fontVariant: ['tabular-nums'], letterSpacing: -3 }, durationRow: { flexDirection: 'row', gap: spacing.xs }, duration: { flex: 1, minHeight: 48, borderRadius: radius.small, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, actionRow: { flexDirection: 'row', gap: spacing.xs }, listText: { ...typography.body, minHeight: 48, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth } });
export const shared = styles;

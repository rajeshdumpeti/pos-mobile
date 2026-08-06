import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui';
import { radius, spacing, typography, usePOSTheme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function LaunchFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<'splash' | 'welcome' | 'priorities' | 'signin'>('splash');
  const { colors } = usePOSTheme();
  const insets = useSafeAreaInsets();
  useEffect(() => { const id = setTimeout(() => setStep('welcome'), 900); return () => clearTimeout(id); }, []);
  if (step === 'splash') return <View style={[s.center, { backgroundColor: colors.background.primary, paddingTop: insets.top, paddingBottom: insets.bottom }]}><View style={[s.mark, { backgroundColor: colors.action.primary }]}><Text style={[s.markText, { color: colors.text.inverse }]}>P</Text></View><Text style={[s.logo, { color: colors.text.primary }]}>POS</Text><Text style={[s.muted, { color: colors.text.muted }]}>Personal Operating System</Text></View>;
  return <View style={[s.page, { backgroundColor: colors.background.primary, paddingTop: insets.top + spacing.huge, paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
    <Text style={[s.step, { color: colors.action.primary }]}>WELCOME TO POS</Text>
    <Text style={[s.title, { color: colors.text.primary }]}>{step === 'welcome' ? 'One calm place for your day.' : step === 'priorities' ? 'Start with what matters.' : 'Your demo is ready.'}</Text>
    <Text style={[s.body, { color: colors.text.secondary }]}>{step === 'welcome' ? 'Plan, track, and review your life without the noise.' : step === 'priorities' ? 'Health, focus, and finances are selected for this demo. Units: lb · Currency: USD.' : 'No password or personal information required.'}</Text>
    <View style={s.spacer} />
    {step === 'welcome' && <Button title="Get started" onPress={() => setStep('priorities')} />}
    {step === 'priorities' && <><Button title="Keep these priorities" onPress={() => setStep('signin')} /><Button secondary title="Skip setup" onPress={() => setStep('signin')} /></>}
    {step === 'signin' && <><Button title="Continue with Demo Account" onPress={onComplete} /><Button secondary title="Continue with Apple (mock)" onPress={onComplete} /><Button secondary title="Continue with Google (mock)" onPress={onComplete} /></>}
  </View>;
}
const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  mark: { width: 62, height: 62, borderRadius: radius.large, alignItems: 'center', justifyContent: 'center' }, markText: { fontSize: 30, fontWeight: '800' },
  logo: { fontSize: 30, fontWeight: '800', letterSpacing: 4 }, muted: typography.secondary,
  page: { flex: 1, paddingHorizontal: spacing.xxl, gap: spacing.md }, step: { ...typography.caption, letterSpacing: 1.2 },
  title: typography.display, body: { fontSize: 18, lineHeight: 27 }, spacer: { flex: 1 },
});

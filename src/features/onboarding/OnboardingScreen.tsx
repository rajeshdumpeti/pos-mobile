import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Screen } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { routes } from '@/navigation';
import { useOnboarding } from './useOnboarding';
import type { Currency, Priority, UnitSystem } from './types';
import { GoalsFields } from './GoalsFields';
import { goalDraftFromResource, serializeGoals, type GoalDraft, type GoalErrors } from './goals';
import { authoritativeResumeStep, nextActiveStep, onboardingTitles as titles } from './workflow';

const copy = [
  'We help you become your best self.',
  'Everything connects. Not just another tracker.',
  'Select at least one area.',
  'Choose preferences only. Connections come later.',
  'Set optional targets and confirm your measurement preferences.',
  'Choose what matters. Device permission is never requested here.',
  'POS learns only from real information you choose to provide.',
  'Your Personal Operating System is ready.',
];
const label = (value: string) =>
  value.replaceAll('_', ' ').replace(/\b\w/g, (x) => x.toUpperCase());
export function OnboardingScreen() {
  const submitting = useRef(false);
  const hydrated = useRef(false);
  const theme = useTheme(),
    router = useRouter(),
    { query, save, complete, failure, reviewRequired, acknowledgeReview } = useOnboarding();
  const [step, setStep] = useState(0);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [unit, setUnit] = useState<UnitSystem | null>(null);
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [goalDraft, setGoalDraft] = useState<GoalDraft>({});
  const [goalErrors, setGoalErrors] = useState<GoalErrors>({});
  const [integrations, setIntegrations] = useState<
    Record<string, 'interested' | 'not_interested' | 'deferred'>
  >({});
  const [notifications, setNotifications] = useState<
    Record<string, 'enabled' | 'disabled' | 'deferred'>
  >({});
  useEffect(() => {
    if (query.data) {
      if (reviewRequired && hydrated.current) {
        setPriorities((current) =>
          current.filter((value) => query.data!.configuration.priority_life_areas.includes(value)),
        );
        setGoalDraft((current) =>
          Object.fromEntries(
            Object.entries(current).filter(([field]) =>
              query.data!.configuration.optional_goal_fields.includes(field as never),
            ),
          ),
        );
        setIntegrations((current) =>
          Object.fromEntries(
            Object.entries(current).filter(([key]) =>
              query.data!.configuration.integration_identifiers.includes(key as never),
            ),
          ),
        );
        setNotifications((current) =>
          Object.fromEntries(
            Object.entries(current).filter(([key]) =>
              query.data!.configuration.notification_identifiers.includes(key as never),
            ),
          ),
        );
        if (unit && !query.data.configuration.unit_systems.includes(unit)) setUnit(null);
        if (currency && !query.data.configuration.currencies.includes(currency)) setCurrency(null);
        if (!query.data.requirements.ready_to_complete) {
          if (query.data.recommended_next_action === 'select_priority_life_areas') setStep(2);
          if (
            query.data.recommended_next_action === 'confirm_unit_system' ||
            query.data.recommended_next_action === 'confirm_currency'
          )
            setStep(4);
        }
        return;
      }
      if (hydrated.current) return;
      setPriorities(query.data.priority_life_areas);
      setUnit(query.data.unit_preference.value);
      setCurrency(query.data.currency_preference.value);
      setGoalDraft(goalDraftFromResource(query.data.goals));
      setGoalErrors({});
      setIntegrations(
        Object.fromEntries(
          Object.entries(query.data.integration_preferences).filter((entry) => entry[1] !== null),
        ) as Record<string, 'interested' | 'not_interested' | 'deferred'>,
      );
      setNotifications(
        Object.fromEntries(
          Object.entries(query.data.notification_preferences).filter((entry) => entry[1] !== null),
        ) as Record<string, 'enabled' | 'disabled' | 'deferred'>,
      );
      hydrated.current = true;
      setStep(authoritativeResumeStep(query.data));
    }
  }, [query.data, reviewRequired]);
  useEffect(() => {
    if (failure?.kind === 'validation' && failure.fields)
      setGoalErrors((current) => ({ ...current, ...failure.fields }));
  }, [failure]);
  useEffect(() => {
    void AccessibilityInfo.announceForAccessibility(`${titles[step]}. Step ${step + 1} of 8`);
  }, [step]);
  if (query.isPending)
    return (
      <Screen scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accentPrimary} />
          <AppText>Restoring your setup…</AppText>
        </View>
      </Screen>
    );
  if (query.isError || !query.data)
    return (
      <Screen>
        <AppText variant="title">Setup is temporarily unavailable</AppText>
        <AppText color="secondary">Your choices remain unchanged.</AppText>
        <Button label="Try again" onPress={() => query.refetch()} />
      </Screen>
    );
  const data = query.data,
    busy = save.isPending || complete.isPending;
  const toggle = (p: Priority) =>
    setPriorities((v) => (v.includes(p) ? v.filter((x) => x !== p) : [...v, p]));
  const next = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      if (step === 2) {
        if (!priorities.length) return;
        await save.mutateAsync({ priority_life_areas: priorities });
      }
      if (step === 4) {
        if (!unit || !currency) return;
        const parsed = serializeGoals(
          goalDraft,
          data.configuration.optional_goal_fields,
          unit,
          currency,
        );
        setGoalErrors(parsed.errors);
        if (Object.keys(parsed.errors).length) return;
        await save.mutateAsync({
          unit_system: unit,
          unit_system_confirmed: true,
          currency,
          currency_confirmed: true,
          ...(Object.keys(parsed.goals).length ? { goals: parsed.goals } : {}),
        });
      }
      if (step === 3) await save.mutateAsync({ integration_preferences: integrations });
      if (step === 5) await save.mutateAsync({ notification_preferences: notifications });
      if (step === 7) {
        const result = await complete.mutateAsync();
        if (result.status === 'completed') router.replace(routes.app.index);
        return;
      }
      setStep(nextActiveStep);
    } catch {
      // The mutation state renders a fixed safe error; drafts remain in memory.
    } finally {
      submitting.current = false;
    }
  };
  const skip = async () => {
    if (submitting.current || (step !== 3 && step !== 5)) return;
    submitting.current = true;
    try {
      if (step === 3) {
        const deferred = Object.fromEntries(
          data.configuration.integration_identifiers.map((identifier) => [identifier, 'deferred']),
        ) as Record<string, 'deferred'>;
        await save.mutateAsync({ integration_preferences: deferred });
        setIntegrations(deferred);
      } else {
        const deferred = Object.fromEntries(
          data.configuration.notification_identifiers.map((identifier) => [identifier, 'deferred']),
        ) as Record<string, 'deferred'>;
        await save.mutateAsync({ notification_preferences: deferred });
        setNotifications(deferred);
      }
      setStep(nextActiveStep);
    } catch {
      // The shared mutation state retains the current screen and renders safe recovery.
    } finally {
      submitting.current = false;
    }
  };
  const options =
    step === 2
      ? data.configuration.priority_life_areas
      : step === 4
        ? []
        : step === 3
          ? data.configuration.integration_identifiers
          : step === 5
            ? data.configuration.notification_identifiers
            : [];
  return (
    <Screen
      keyboardSafe={step === 4}
      contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
      testID="onboarding-screen"
    >
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Step ${step + 1} of 8`}
        accessibilityValue={{ min: 1, max: 8, now: step + 1, text: `Step ${step + 1} of 8` }}
        style={styles.progress}
      >
        {titles.map((_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              { backgroundColor: i <= step ? theme.colors.accentPrimary : theme.colors.divider },
            ]}
          />
        ))}
      </View>
      <View style={styles.heading}>
        <AppText variant="heading" accessibilityRole="header">
          {titles[step]}
        </AppText>
        <AppText color="secondary">{copy[step]}</AppText>
      </View>
      {options.map((value) => {
        const selected =
          step === 2
            ? priorities.includes(value as Priority)
            : step === 3
              ? integrations[value] === 'interested'
              : notifications[value] === 'enabled';
        return (
          <Pressable
            key={value}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            onPress={() => {
              if (step === 2) toggle(value as Priority);
              if (step === 3)
                setIntegrations((current) => ({
                  ...current,
                  [value]: selected ? 'deferred' : 'interested',
                }));
              if (step === 5)
                setNotifications((current) => ({
                  ...current,
                  [value]: selected ? 'deferred' : 'enabled',
                }));
            }}
          >
            <Card
              style={{
                borderColor: selected ? theme.colors.accentPrimary : theme.colors.borderDefault,
                borderWidth: 1,
              }}
            >
              <View style={styles.row}>
                <AppText variant="label">{label(value)}</AppText>
                <AppText color={selected ? 'accent' : 'muted'}>
                  {selected ? 'Selected' : 'Optional'}
                </AppText>
              </View>
            </Card>
          </Pressable>
        );
      })}
      {step === 4 && (
        <>
          <AppText variant="label">Unit system</AppText>
          <View style={styles.row}>
            {data.configuration.unit_systems.map((v) => (
              <Button
                key={v}
                label={label(v)}
                variant={unit === v ? 'primary' : 'secondary'}
                accessibilityState={{ selected: unit === v }}
                onPress={() => setUnit(v)}
              />
            ))}
          </View>
          <AppText variant="label">Currency</AppText>
          <View style={styles.wrap}>
            {data.configuration.currencies.map((v) => (
              <Button
                key={v}
                label={v}
                variant={currency === v ? 'primary' : 'secondary'}
                accessibilityState={{ selected: currency === v }}
                onPress={() => setCurrency(v)}
              />
            ))}
          </View>
          <AppText color="secondary">Goals are optional and can be added later.</AppText>
          <AppText color="secondary">
            These are targets you define, not medical or financial advice.
          </AppText>
          {unit && currency && (
            <GoalsFields
              supported={data.configuration.optional_goal_fields}
              draft={goalDraft}
              errors={goalErrors}
              unit={unit}
              currency={currency}
              disabled={busy}
              onChange={(field, value) => {
                setGoalDraft((current) => ({ ...current, [field]: value }));
                setGoalErrors((current) => ({ ...current, [field]: undefined }));
              }}
            />
          )}
        </>
      )}
      <View style={styles.spacer} />
      {failure && (
        <View accessibilityRole="alert">
          <AppText color="danger">{failure.message}</AppText>
          {failure.retryAfterSeconds && (
            <AppText color="secondary">
              Try again in about {failure.retryAfterSeconds} seconds.
            </AppText>
          )}
          {reviewRequired && (
            <Button
              label="I reviewed the refreshed setup"
              variant="secondary"
              onPress={acknowledgeReview}
            />
          )}
        </View>
      )}
      <Button
        label={step === 7 ? 'Enter POS' : 'Continue'}
        loading={busy}
        disabled={
          (step === 2 && !priorities.length) ||
          (step === 4 && (!unit || !currency)) ||
          failure?.kind === 'forbidden' ||
          (step === 7 && !data.requirements.ready_to_complete)
        }
        onPress={() => void next()}
      />
      {(step === 3 || step === 5) && (
        <Button label="Skip for now" variant="ghost" disabled={busy} onPress={() => void skip()} />
      )}
      {step > 0 && step < 7 && (
        <Button
          label="Back"
          variant="ghost"
          disabled={busy}
          onPress={() => setStep((v) => v - 1)}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  progress: { flexDirection: 'row', gap: 4 },
  segment: { height: 3, flex: 1, borderRadius: 99 },
  heading: { gap: 8, marginVertical: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  spacer: { flex: 1, minHeight: 24 },
});

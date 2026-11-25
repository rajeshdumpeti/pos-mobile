import type { PlanContext } from '@/features/plan/calendar';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Keyboard,
  TextInput as NativeTextInput,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import type { EntrySource } from '@/api/client';
import { useRouter, useNavigation } from 'expo-router';
import { AppText, Checkbox, LoadingIndicator, TextInput } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { routes, useSafeNavigation } from '@/navigation';
import { useAuthenticationConnectivity } from '@/features/auth/integration/useConnectivity';
import { usePlanning } from './PlanningProvider';
import { usePlanItem } from './usePlanItem';
import { usePlanMutations } from './usePlanMutations';
import { PlanItemPage, FailureNotice } from './PlanItemPage';
import { validPlanId } from './PlanItemDetailScreen';
import {
  draftFromCreation,
  draftFromItem,
  emptyDraft,
  serializeDraft,
  type PlanDraft,
} from './draft';
import { mapPlanningFailure } from './failure';
import { resolveTimeZone } from './time';
import { PlanningButton as Button, PlanningCard as Card, PlanningCard } from './TodayVisuals';
import { ScheduleFields } from './ScheduleFields';
import { friendlyDate } from './presentation';
import { usePreventRemove } from 'expo-router/react-navigation';
import { takeVoicePrefill } from '@/features/voice/prefill';
import type { NativeStackNavigationProp } from 'expo-router/native-stack';
export function PlanItemFormScreen({
  id: input,
  mode = 'create',
  context,
  entrySource = 'manual',
}: {
  id?: string | string[];
  mode?: 'create' | 'edit';
  context?: PlanContext;
  entrySource?: Exclude<EntrySource, 'voice'>;
}) {
  const id = validPlanId(input),
    edit = mode === 'edit',
    planning = usePlanning(),
    query = usePlanItem(edit ? id : undefined);
  const mutations = usePlanMutations(edit ? id : undefined, { entrySource }),
    router = useRouter(),
    navigation = useSafeNavigation(),
    nativeNavigation = useNavigation<NativeStackNavigationProp<Record<string, undefined>>>(),
    theme = useTheme(),
    connectivity = useAuthenticationConnectivity();
  const baseVersion = useRef<number | undefined>(undefined),
    hydrated = useRef(false),
    titleInput = useRef<NativeTextInput>(null);
  const draftKey = edit ? `edit:${id}` : context ? `create:plan:${context.selectedDate}` : 'create';
  // "Type it instead" from voice hands over what was understood once, in memory only.
  const voicePrefill = useRef<Partial<PlanDraft> | undefined>(undefined);
  const voicePrefillRead = useRef(false);
  if (!voicePrefillRead.current) {
    voicePrefillRead.current = true;
    if (!edit) voicePrefill.current = takeVoicePrefill();
  }
  const initialDraft = (withPrefill = false): PlanDraft => ({
    ...emptyDraft(resolveTimeZone()),
    ...(context ? { date: context.selectedDate } : {}),
    ...(withPrefill ? voicePrefill.current : {}),
  });
  const stored = planning.drafts?.get(draftKey);
  const confirmedWrite = useRef(false),
    titleInteracted = useRef(false);
  const attempt = planning.creation.getAttempt();
  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<PlanDraft>({
    defaultValues:
      attempt && !edit
        ? draftFromCreation(attempt.payload)
        : (stored?.values ?? initialDraft(true)),
  });
  const openingComplete = useRef(Platform.OS === 'web');
  const [creationRevision, setCreationRevision] = useState(0);
  const unresolved = !edit && planning.creation.needsReconciliation();
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cancel = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };
    const schedule = () => {
      cancel();
      if (edit || unresolved) return;
      // Preserve the keyboard settling delay, measured after native modal presentation.
      timer = setTimeout(() => {
        if (active && nativeNavigation.isFocused()) titleInput.current?.focus();
      }, 180);
    };
    const stopStart = nativeNavigation.addListener('transitionStart', () => {
      openingComplete.current = false;
      cancel();
    });
    const stopEnd = nativeNavigation.addListener('transitionEnd', (event) => {
      openingComplete.current = !event.data.closing;
      if (openingComplete.current) schedule();
      else cancel();
    });
    const stopBlur = nativeNavigation.addListener('blur', cancel);
    // Web has no native modal presentation events. Also handle reconciliation after opening.
    if (openingComplete.current && nativeNavigation.isFocused()) schedule();
    return () => {
      active = false;
      cancel();
      stopStart();
      stopEnd();
      stopBlur();
    };
  }, [edit, unresolved, nativeNavigation]);
  const blocked =
    mutations.busy ||
    (!edit && planning.creation.isBusy()) ||
    unresolved ||
    mutations.reviewRequired ||
    connectivity === 'offline' ||
    (edit && !query.data);
  useEffect(() => {
    if (edit && query.data && !hydrated.current) {
      hydrated.current = true;
      baseVersion.current = stored?.version ?? query.data.version;
      if (!stored) reset(draftFromItem(query.data));
    }
  }, [edit, query.data, reset]);
  usePreventRemove(mutations.busy, ({ data }) => {
    if (confirmedWrite.current) nativeNavigation.dispatch(data.action);
    else AccessibilityInfo.announceForAccessibility('Wait until this save has finished.');
  });
  useEffect(() => {
    const subscription = watch(() => {
      if (!confirmedWrite.current && planning.current())
        planning.drafts?.set(draftKey, { values: getValues(), version: baseVersion.current });
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, planning, draftKey]);
  useEffect(() => {
    if (mutations.failure) AccessibilityInfo.announceForAccessibility(mutations.failure.message);
  }, [mutations.failure]);
  const confirmed = (result: Awaited<ReturnType<typeof mutations.create>>) => {
    if (!result || !planning.current()) return;
    confirmedWrite.current = true;
    planning.drafts?.delete(draftKey);
    AccessibilityInfo.announceForAccessibility(
      edit ? 'Plan item update confirmed.' : 'Plan item creation confirmed.',
    );
    if (!edit && context) {
      if (router.canGoBack()) router.back();
      else
        router.replace({
          pathname: routes.app.plan,
          params: { selectedDate: context.selectedDate },
        });
    } else if (edit && context && !router.canGoBack()) {
      router.replace({ pathname: routes.app.planItem, params: { id: result.id, ...context } });
    } else if (edit) navigation.backOrReplace(routes.app.index);
    else router.replace({ pathname: routes.app.planItem, params: { id: result.id } });
  };
  const submit = handleSubmit((draft) => {
    clearErrors();
    const value = serializeDraft(draft);
    if (value.errors) {
      for (const [name, message] of Object.entries(value.errors))
        setError(name as keyof PlanDraft, { type: 'validate', message }, { shouldFocus: true });
      AccessibilityInfo.announceForAccessibility('Review the highlighted planning fields.');
      return;
    }
    if (edit && baseVersion.current !== undefined)
      void mutations
        .update({ ...value.payload, expected_version: baseVersion.current })
        .then(confirmed);
    else if (!edit) void mutations.create(value.payload).then(confirmed);
  });
  const reload = () =>
    void query.refetch().then((result) => {
      if (result.data && !result.isError) mutations.confirmReview();
    });
  return (
    <PlanItemPage
      context={context}
      title={edit ? 'Edit plan item' : 'Create plan item'}
      busy={mutations.busy}
      footer={
        !unresolved && (!edit || (query.data && !query.data.completed_at)) ? (
          <Button
            label={edit ? 'Save changes' : 'Create plan item'}
            loading={mutations.busy}
            disabled={blocked || Boolean(query.data?.completed_at)}
            onPress={() => void submit()}
          />
        ) : undefined
      }
    >
      {edit && !id && (
        <AppText accessibilityRole="alert" color="danger">
          Open a valid plan item from Today.
        </AppText>
      )}
      {edit && query.isPending && id && <LoadingIndicator label="Loading item for editing" />}
      {edit && query.error && (
        <>
          <FailureNotice failure={mapPlanningFailure(query.error)} />
          <Button label="Reload item" onPress={reload} />
        </>
      )}
      {edit && query.data?.completed_at ? (
        <AppText>This item is complete and cannot be edited.</AppText>
      ) : (
        (!edit || query.data) && (
          <>
            {connectivity === 'offline' && (
              <AppText accessibilityRole="alert">
                You’re offline. Your draft is kept here until you return; it won’t send
                automatically.
              </AppText>
            )}
            <View style={{ gap: theme.spacing.sm }} key={creationRevision}>
              <AppText variant="title" accessibilityRole="header">
                Essential
              </AppText>
              <Controller
                control={control}
                name="title"
                render={({ field: { value, onChange, onBlur, ref } }) => (
                  <TextInput
                    ref={(node) => {
                      ref(node);
                      titleInput.current = node;
                    }}
                    label="Title"
                    value={value}
                    onChangeText={(text) => {
                      titleInteracted.current = true;
                      onChange(text);
                      clearErrors('title');
                    }}
                    onBlur={() => {
                      onBlur();
                      if (titleInteracted.current || isSubmitted) {
                        const issue = serializeDraft(getValues()).errors?.title;
                        if (issue) setError('title', { type: 'validate', message: issue });
                      }
                    }}
                    error={errors.title?.message}
                    disabled={blocked}
                    onTouchStart={() => {
                      titleInteracted.current = true;
                    }}
                    showSoftInputOnFocus
                    autoCapitalize="sentences"
                    maxLength={200}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                )}
              />
            </View>
            <ScheduleFields
              draft={watch()}
              disabled={blocked}
              errors={Object.fromEntries(
                Object.entries(errors).map(([name, error]) => [name, error?.message]),
              )}
              onChange={(patch) => {
                for (const [name, value] of Object.entries(patch))
                  setValue(name as keyof PlanDraft, value, { shouldDirty: true });
                clearErrors(['date', 'start', 'end']);
              }}
            />
            <View style={{ gap: theme.spacing.sm }}>
              <AppText variant="title" accessibilityRole="header">
                Importance
              </AppText>
              <PlanningCard>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field: { value, onChange } }) => (
                    <Checkbox
                      label="Mark as a priority"
                      checked={value}
                      onChange={onChange}
                      disabled={blocked}
                    />
                  )}
                />
              </PlanningCard>
            </View>
            {errors.timezone && (
              <AppText accessibilityRole="alert" color="danger">
                {errors.timezone.message}
              </AppText>
            )}
            <FailureNotice failure={mutations.failure} />
            {mutations.reviewRequired && (
              <Card style={{ gap: theme.spacing.sm }}>
                <AppText accessibilityRole="alert">
                  Your draft has not overwritten the server. Review the latest item before
                  continuing.
                </AppText>
                {query.data && (
                  <>
                    <AppText variant="label">Latest: {query.data.title}</AppText>
                    <AppText color="secondary">
                      Version {query.data.version} ·{' '}
                      {query.data.completed_at ? 'Completed' : 'Incomplete'} ·{' '}
                      {friendlyDate(query.data.scheduled_for_date, query.data.timezone)}
                    </AppText>
                  </>
                )}
                {!mutations.reviewReady && (
                  <Button label="Load latest item for review" onPress={reload} />
                )}
                <Button
                  label="Use latest item after review"
                  variant="secondary"
                  disabled={!mutations.reviewReady || query.isError}
                  onPress={() => {
                    if (query.data) {
                      baseVersion.current = query.data.version;
                      reset(draftFromItem(query.data));
                      mutations.acknowledgeReview();
                    }
                  }}
                />
                <Button
                  label="Keep my draft after review"
                  variant="secondary"
                  disabled={
                    !mutations.reviewReady || query.isError || Boolean(query.data?.completed_at)
                  }
                  onPress={() => {
                    if (query.data) {
                      baseVersion.current = query.data.version;
                      mutations.acknowledgeReview();
                    }
                  }}
                />
              </Card>
            )}
            {unresolved && (
              <Card style={{ gap: theme.spacing.sm }}>
                <AppText accessibilityRole="alert">
                  Your earlier creation may already exist. The original key and submitted values are
                  kept for an explicit retry.
                </AppText>
                <Button
                  label="Retry original creation"
                  disabled={mutations.busy || connectivity === 'offline'}
                  loading={mutations.busy}
                  onPress={() => {
                    const original = planning.creation.getAttempt();
                    if (original) void mutations.create({ ...original.payload }).then(confirmed);
                  }}
                />
                <Button
                  label="Review Today"
                  variant="secondary"
                  onPress={() => router.navigate(routes.app.index)}
                />
                <AppText color="secondary">
                  Starting another item could create a duplicate. Review Today before choosing a new
                  logical creation.
                </AppText>
                <Button
                  label="I reviewed Today; start a new item"
                  variant="ghost"
                  disabled={mutations.busy}
                  onPress={() => {
                    planning.creation.reset();
                    reset(initialDraft());
                    clearErrors();
                    setCreationRevision((value) => value + 1);
                  }}
                />
              </Card>
            )}
          </>
        )
      )}
    </PlanItemPage>
  );
}

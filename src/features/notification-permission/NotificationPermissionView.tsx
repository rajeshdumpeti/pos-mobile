import { View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  IconButton,
  LoadingIndicator,
  POSIcon,
  Screen,
} from '@/design-system';
import { useTheme } from '@/design-system/theme';
import type { PermissionState } from './controller';

export function NotificationPermissionView({
  state,
  enable,
  retry,
  settings,
  close,
}: {
  state: PermissionState;
  enable: () => void;
  retry: () => void;
  settings: () => void;
  close: () => void;
}) {
  const t = useTheme();
  const permission = state.permission;
  const granted = permission?.authorization === 'authorized';
  const limited =
    permission?.authorization === 'provisional' || permission?.authorization === 'ephemeral';
  const unsupported = permission?.authorization === 'unsupported';
  const busy =
    state.phase === 'checking' || state.phase === 'requesting' || state.phase === 'openingSettings';
  const canRequest = permission?.canAskAgain && !granted && !unsupported;
  const denied =
    permission?.authorization === 'denied' ||
    (permission && !permission.canAskAgain && !granted && !limited && !unsupported);
  const title = granted
    ? "You're all set!"
    : permission?.authorization === 'provisional'
      ? 'Quiet notifications are enabled'
      : permission?.authorization === 'ephemeral'
        ? 'Temporary notification access'
        : denied
          ? 'You’re in control'
          : 'Stay on track with notifications';
  return (
    <Screen
      header={
        <View style={{ paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.sm }}>
          <IconButton
            icon="close"
            accessibilityLabel="Close notification permission"
            onPress={close}
          />
        </View>
      }
      contentContainerStyle={{ gap: t.spacing.xl }}
    >
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: t.spacing.lg,
          paddingVertical: t.spacing.xl,
        }}
      >
        {!granted && <POSIcon name="calendar" size={32} tone="accent" />}
        <View
          style={{
            width: 112,
            height: 112,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: t.radii.large,
            backgroundColor: granted ? t.colors.successSoft : t.colors.accentSoft,
          }}
        >
          <POSIcon
            name={granted ? 'check' : 'notifications'}
            size={56}
            color={granted ? t.colors.success : t.colors.accentPrimary}
          />
        </View>
        {!granted && <POSIcon name="calendar" size={32} tone="accent" />}
      </View>
      <View style={{ gap: t.spacing.md }} accessibilityLiveRegion="polite">
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
        <AppText color="secondary">
          {granted
            ? 'Notification permission is enabled on this device.'
            : permission?.authorization === 'provisional'
              ? 'iOS allows quiet notifications. This is not full alert permission. You can still use POS without alerts.'
              : permission?.authorization === 'ephemeral'
                ? 'iOS has granted temporary notification access. This is not permanent alert permission. You can still use POS without notifications.'
                : denied
                  ? 'You can still use POS without notifications. You decide whether to enable them.'
                  : 'Get gentle reminders for your Today tasks and upcoming Plan items.'}
        </AppText>
      </View>
      {!granted && !limited && !denied && !unsupported && (
        <View style={{ gap: t.spacing.md }}>
          {(
            [
              ['today', 'Timely reminders', 'For your daily tasks'],
              ['calendar', 'Upcoming plans', 'Reminders for scheduled items'],
            ] as const
          ).map(([icon, heading, detail]) => (
            <Card
              key={heading}
              style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}
            >
              <POSIcon name={icon} size={28} tone="accent" />
              <View style={{ flex: 1, gap: t.spacing.xs }}>
                <AppText variant="label">{heading}</AppText>
                <AppText color="secondary">{detail}</AppText>
              </View>
            </Card>
          ))}
        </View>
      )}
      {busy && (
        <LoadingIndicator
          label={
            state.phase === 'requesting'
              ? 'Waiting for notification permission'
              : state.phase === 'openingSettings'
                ? 'Opening device settings'
                : 'Checking notification permission'
          }
        />
      )}
      {state.failure && (
        <AppText accessibilityRole="alert" color="danger">
          {state.failure === 'settings'
            ? 'Device settings could not be opened. You can open them manually or return to POS.'
            : state.failure === 'request'
              ? 'Permission could not be requested. You can try again or keep using POS.'
              : 'Permission could not be checked. Check again or keep using POS.'}
        </AppText>
      )}
      {unsupported && (
        <AppText color="secondary">
          Notification permission is available in the iOS or Android app. You can keep using POS
          here.
        </AppText>
      )}
      {(granted || limited || denied) && (
        <Card style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.sm }}>
          <POSIcon name="info" tone="accent" />
          <AppText color="secondary" style={{ flex: 1 }}>
            You can manage notification permission and alert options in your device settings.
          </AppText>
        </Card>
      )}
      <View style={{ flex: 1 }} />
      <View style={{ gap: t.spacing.sm }}>
        {granted ? (
          <Button label="Continue" onPress={close} />
        ) : state.failure === 'check' ? (
          <Button label="Check again" disabled={busy} onPress={retry} />
        ) : canRequest ? (
          <Button label="Enable Notifications" disabled={busy} onPress={enable} />
        ) : !busy && permission && !unsupported ? (
          <Button label="Open Settings" onPress={settings} />
        ) : null}
        {!granted && <Button label="Not now" variant="ghost" onPress={close} />}
      </View>
    </Screen>
  );
}

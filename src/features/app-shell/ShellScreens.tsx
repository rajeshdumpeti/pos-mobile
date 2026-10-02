import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { AppText, Button, IconButton, Screen } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { ShellHeader } from './ShellHeader';
import { ShellModalPanel } from './ShellModalPanel';
import { routes, useSafeNavigation } from '@/navigation';
import { useAuthenticationCapabilities } from '@/features/auth/integration';
export function PrimaryScreen({ title, body }: { title: string; body: string }) {
  return (
    <Screen>
      <ShellHeader title={title} />
      <AppText color="secondary">{body}</AppText>
    </Screen>
  );
}
export function SecondaryScreen({
  title,
  body,
  modal = false,
  children,
}: {
  title: string;
  body: string;
  modal?: boolean;
  children?: React.ReactNode;
}) {
  const navigation = useSafeNavigation();
  const theme = useTheme();
  const leaving = useRef(false);
  const back = () => {
    if (leaving.current) return;
    leaving.current = true;
    if (modal) navigation.dismissOrReplace(routes.app.index);
    else navigation.backOrReplace(routes.app.index);
  };
  const content = (onBack: () => void) => (
    <Screen
      contentContainerStyle={
        modal
          ? {
              paddingTop: theme.spacing.md,
              paddingHorizontal: theme.spacing.md,
              paddingBottom: theme.spacing.xl,
            }
          : undefined
      }
    >
      <View
        testID="secondary-header"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.accentSoft,
          borderRadius: theme.radii.large,
          padding: theme.spacing.xs,
        }}
      >
        <IconButton icon="back" accessibilityLabel={`Back from ${title}`} onPress={onBack} />
        <AppText
          variant="heading"
          accessibilityRole="header"
          style={{ flex: 1, textAlign: 'center' }}
        >
          {title}
        </AppText>
        <View style={{ width: theme.controlSizes.iconButton }} />
      </View>
      <AppText color="secondary">{body}</AppText>
      {children}
    </Screen>
  );
  return modal ? (
    <ShellModalPanel title={title} onDismiss={back}>
      {content}
    </ShellModalPanel>
  ) : (
    content(back)
  );
}
export function ProfileScreen() {
  const { session } = useAuthenticationCapabilities(),
    client = useQueryClient();
  const pending = useRef(false),
    [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false);
  return (
    <SecondaryScreen title="Profile" body="Your profile content goes here." modal>
      <Button
        label="Log Out"
        loading={busy}
        disabled={busy}
        onPress={() => {
          if (pending.current) return;
          pending.current = true;
          setBusy(true);
          setFailed(false);
          void session
            .logout()
            .then(() => client.clear())
            .catch(() => setFailed(true))
            .finally(() => {
              pending.current = false;
              setBusy(false);
            });
        }}
      />
      {failed && (
        <AppText accessibilityRole="alert" color="danger">
          We couldn’t finish signing out. Try again.
        </AppText>
      )}
    </SecondaryScreen>
  );
}

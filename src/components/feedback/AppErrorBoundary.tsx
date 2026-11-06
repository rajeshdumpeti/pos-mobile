import React from 'react';

import { AppText, Button, Stack } from '@/design-system/components';

type Props = React.PropsWithChildren;
type State = { error: Error | null };

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) {
      console.error('POS application rendering failed', error);
    }
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <Stack
        accessible
        accessibilityRole="alert"
        align="center"
        justify="center"
        padding="xl"
        style={{ flex: 1 }}
      >
        <AppText accessibilityRole="header" variant="title">
          POS could not finish starting
        </AppText>
        <AppText color="secondary" style={{ textAlign: 'center' }}>
          Try loading the app again.
        </AppText>
        {__DEV__ ? <AppText color="muted">{this.state.error.message}</AppText> : null}
        <Button label="Try again" onPress={this.retry} />
      </Stack>
    );
  }
}

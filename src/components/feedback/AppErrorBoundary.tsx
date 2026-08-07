import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
      <View accessible accessibilityRole="alert" style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>
          POS could not finish starting
        </Text>
        <Text style={styles.message}>
          Your local data was not reset. Try loading the app again.
        </Text>
        {__DEV__ ? <Text style={styles.diagnostic}>{this.state.error.message}</Text> : null}
        <Pressable accessibilityRole="button" onPress={this.retry} style={styles.button}>
          <Text style={styles.buttonLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#F6F5F1',
  },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: '#16211C' },
  message: { fontSize: 16, lineHeight: 24, textAlign: 'center', color: '#3C4842' },
  diagnostic: { fontSize: 12, lineHeight: 17, color: '#68736D' },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 20,
    backgroundColor: '#315F4A',
  },
  buttonLabel: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});

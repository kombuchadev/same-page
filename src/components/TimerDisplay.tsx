import { View, Text, StyleSheet } from 'react-native';

interface TimerDisplayProps {
  secondsLeft: number;
  isExpired: boolean;
}

export function TimerDisplay({ secondsLeft, isExpired }: TimerDisplayProps) {
  const isUrgent = secondsLeft <= 5 && !isExpired;

  return (
    <View style={styles.container}>
      <Text style={[styles.timer, isUrgent && styles.urgent, isExpired && styles.expired]}>
        {isExpired ? "Time's up!" : `${secondsLeft}s`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 8,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  urgent: {
    color: '#e74c3c',
  },
  expired: {
    color: '#999',
    fontSize: 24,
  },
});

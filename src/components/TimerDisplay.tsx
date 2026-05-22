import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, FontFamily } from '@/constants/theme';

interface TimerDisplayProps {
  secondsLeft: number;
  isExpired: boolean;
}

export function TimerDisplay({ secondsLeft, isExpired }: TimerDisplayProps) {
  const isUrgent = secondsLeft <= 5 && !isExpired;

  // Progress: assume max 60s. Clamp 0–1.
  const progress = isExpired ? 0 : Math.max(0, Math.min(1, secondsLeft / 60));

  const trackColor = isExpired ? Colors.textDisabled : isUrgent ? Colors.red : Colors.primaryGreen;

  return (
    <View style={styles.container}>
      <Text style={[styles.timer, isUrgent && styles.urgent, isExpired && styles.expired]}>
        {isExpired ? "Time's up!" : `${secondsLeft}s`}
      </Text>
      {/* Progress bar */}
      <View style={styles.track}>
        <View style={[styles.fill, { flex: progress, backgroundColor: trackColor }]} />
        <View style={{ flex: 1 - progress }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  timer: {
    fontFamily: FontFamily.extraBold,
    fontSize: 48,
    color: Colors.primaryGreen,
    marginBottom: 8,
  },
  urgent: {
    color: Colors.red,
  },
  expired: {
    fontFamily: FontFamily.bold,
    color: Colors.textDisabled,
    fontSize: 24,
  },
  track: {
    flexDirection: 'row',
    width: '100%',
    height: 16,
    borderRadius: Radius.badge,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Radius.badge,
  },
});

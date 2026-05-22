import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, FontFamily } from '@/constants/theme';
import { useLoadingMessages, LOADING_MESSAGES } from '@/src/hooks/useLoadingMessages';

interface GameLoadingScreenProps {
  messages?: string[];
}

export function GameLoadingScreen({ messages = LOADING_MESSAGES.generic }: GameLoadingScreenProps) {
  const message = useLoadingMessages(messages, 1600);

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
    return () => pulse.stopAnimation();
  }, [pulse]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.emoji, { transform: [{ scale: pulse }] }]}>🎮</Animated.Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  emoji: {
    fontSize: 56,
  },
  message: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

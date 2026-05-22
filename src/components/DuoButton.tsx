import { useState, useEffect, useRef } from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { Colors, Radius, FontFamily } from '@/constants/theme';
import { useLoadingMessages } from '@/src/hooks/useLoadingMessages';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface DuoButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  loadingMessages?: string[];
  style?: ViewStyle;
}

const variantMap: Record<
  ButtonVariant,
  { bg: string; shadow: string; textColor: string; borderColor?: string }
> = {
  primary: { bg: Colors.primaryGreen, shadow: Colors.greenShadow, textColor: '#FFFFFF' },
  secondary: {
    bg: '#FFFFFF',
    shadow: Colors.secondaryShadow,
    textColor: Colors.textPrimary,
    borderColor: Colors.border,
  },
  danger: { bg: Colors.red, shadow: Colors.dangerShadow, textColor: '#FFFFFF' },
};

/** Three dots that bounce one after another while loading */
function BouncingDots({ color }: { color: string }) {
  const dots = [useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const bounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -5, duration: 220, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.delay(660 - delay),
        ]),
      );

    const anims = dots.map((dot, i) => bounce(dot, i * 140));
    Animated.parallel(anims).start();
    return () => anims.forEach((a) => a.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={bStyles.row}>
      {dots.map((dot, i) => (
        <Animated.Text
          key={i}
          style={[bStyles.dot, { color, transform: [{ translateY: dot }] }]}
        >
          •
        </Animated.Text>
      ))}
    </View>
  );
}

const bStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 6 },
  dot: { fontSize: 18, lineHeight: 18 },
});

export function DuoButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  loadingMessages,
  style,
}: DuoButtonProps) {
  const [pressed, setPressed] = useState(false);
  const { bg, shadow, textColor, borderColor } = variantMap[variant];

  const fallback = [label];
  const cycledLabel = useLoadingMessages(
    loading && loadingMessages ? loadingMessages : fallback,
    1500,
  );

  const isDisabled = disabled || loading;
  const bgColor = isDisabled ? (loading ? bg : Colors.textDisabled) : bg;
  const shadowColor = isDisabled ? (loading ? shadow : Colors.textDisabled) : shadow;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => !loading && setPressed(true)}
      onPressOut={() => !loading && setPressed(false)}
      style={[styles.wrapper, { backgroundColor: shadowColor }, style]}
    >
      <View
        style={[
          styles.face,
          {
            backgroundColor: bgColor,
            borderColor: borderColor ?? 'transparent',
            borderWidth: borderColor ? 2 : 0,
            marginBottom: pressed && !loading ? 0 : 4,
            marginTop: pressed && !loading ? 4 : 0,
            opacity: loading ? 0.9 : 1,
          },
        ]}
      >
        <View style={styles.inner}>
          <Text style={[styles.label, { color: isDisabled && !loading ? '#FFFFFF' : textColor }]}>
            {loading && loadingMessages ? cycledLabel : label}
          </Text>
          {loading && <BouncingDots color={textColor} />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Radius.button,
    overflow: 'hidden',
  },
  face: {
    borderRadius: Radius.button,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

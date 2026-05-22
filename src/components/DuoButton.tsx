import { useState } from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, FontFamily } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface DuoButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
}

const variantMap: Record<
  ButtonVariant,
  { bg: string; shadow: string; textColor: string; borderColor?: string }
> = {
  primary: {
    bg: Colors.primaryGreen,
    shadow: Colors.greenShadow,
    textColor: '#FFFFFF',
  },
  secondary: {
    bg: '#FFFFFF',
    shadow: Colors.secondaryShadow,
    textColor: Colors.textPrimary,
    borderColor: Colors.border,
  },
  danger: { bg: Colors.red, shadow: Colors.dangerShadow, textColor: '#FFFFFF' },
};

export function DuoButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: DuoButtonProps) {
  const [pressed, setPressed] = useState(false);
  const { bg, shadow, textColor, borderColor } = variantMap[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.wrapper, { backgroundColor: disabled ? Colors.textDisabled : shadow }, style]}
    >
      <View
        style={[
          styles.face,
          {
            backgroundColor: disabled ? Colors.textDisabled : bg,
            borderColor: borderColor ?? 'transparent',
            borderWidth: borderColor ? 2 : 0,
            marginBottom: pressed ? 0 : 4,
            marginTop: pressed ? 4 : 0,
          },
        ]}
      >
        <Text style={[styles.label, { color: disabled ? '#FFFFFF' : textColor }]}>{label}</Text>
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
  label: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

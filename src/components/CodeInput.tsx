import { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Colors, Radius, FontFamily } from '@/constants/theme';

interface CodeInputProps {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
}

/**
 * OTP-style code entry: `length` separate boxes backed by a single hidden
 * numeric input, so keyboard, backspace and paste all behave normally.
 */
export function CodeInput({ value, onChangeText, length = 4, autoFocus }: CodeInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    onChangeText(text.replace(/[^0-9]/g, '').slice(0, length));
  };

  return (
    <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
      {Array.from({ length }).map((_, i) => {
        const char = value[i] ?? '';
        const isActive =
          focused && (i === value.length || (value.length >= length && i === length - 1));
        return (
          <View
            key={i}
            style={[styles.cell, char !== '' && styles.cellFilled, isActive && styles.cellActive]}
          >
            <Text style={styles.cellText}>{char}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  cell: {
    flex: 1,
    height: 55,
    borderRadius: Radius.input,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    borderColor: Colors.primaryGreen,
    backgroundColor: '#EFFFDC',
  },
  cellActive: {
    borderColor: Colors.blue,
  },
  cellText: {
    fontFamily: FontFamily.extraBold,
    fontSize: 30,
    color: Colors.textPrimary,
  },
  // Full-cover transparent input: captures taps, keyboard and paste.
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
});

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGame } from '@/src/context/GameContext';
import { DuoButton } from '@/src/components/DuoButton';
import { Colors, Radius, FontFamily } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { joinRoom, loading, error } = useGame();
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleCreate = () => {
    if (!nickname.trim()) {
      Alert.alert('Oops!', 'Please enter a nickname');
      return;
    }
    router.push(`/create?nickname=${encodeURIComponent(nickname.trim())}`);
  };

  const handleJoin = async () => {
    if (!nickname.trim()) {
      Alert.alert('Oops!', 'Please enter a nickname');
      return;
    }
    if (!joinCode.trim() || joinCode.trim().length !== 4) {
      Alert.alert('Oops!', 'Please enter a valid 4-digit room code');
      return;
    }
    try {
      await joinRoom(joinCode.trim(), nickname.trim());
      router.push(`/lobby/${joinCode.trim()}`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🟢</Text>
          <Text style={styles.title}>Same Page</Text>
          <Text style={styles.subtitle}>Think alike. Score together.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>YOUR NICKNAME</Text>
            <TextInput
              style={[styles.input, focused === 'nickname' && styles.inputFocused]}
              placeholder="Enter nickname…"
              placeholderTextColor={Colors.textDisabled}
              value={nickname}
              onChangeText={setNickname}
              maxLength={20}
              autoCapitalize="none"
              onFocus={() => setFocused('nickname')}
              onBlur={() => setFocused(null)}
            />
          </View>

          {!showJoin ? (
            <View style={styles.buttonGroup}>
              <DuoButton label="Create Room" onPress={handleCreate} />
              <DuoButton label="Join Room" onPress={() => setShowJoin(true)} variant="secondary" />
            </View>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ROOM CODE</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.codeInput,
                    focused === 'code' && styles.inputFocused,
                  ]}
                  placeholder="0000"
                  placeholderTextColor={Colors.textDisabled}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  maxLength={4}
                  keyboardType="number-pad"
                  textAlign="center"
                  onFocus={() => setFocused('code')}
                  onBlur={() => setFocused(null)}
                />
              </View>
              <View style={styles.buttonGroup}>
                <DuoButton
                  label={loading ? 'Joining…' : 'Join'}
                  onPress={handleJoin}
                  disabled={loading}
                />
                <DuoButton label="Back" onPress={() => setShowJoin(false)} variant="secondary" />
              </View>
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 52,
    marginBottom: 8,
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: 36,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.background,
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    fontFamily: FontFamily.semiBold,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radius.input,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  inputFocused: {
    borderColor: Colors.blue,
  },
  codeInput: {
    fontFamily: FontFamily.extraBold,
    fontSize: 32,
    letterSpacing: 10,
    paddingVertical: 14,
  },
  buttonGroup: {
    gap: 12,
    marginTop: 4,
  },
  error: {
    fontFamily: FontFamily.semiBold,
    color: Colors.red,
    marginTop: 14,
    textAlign: 'center',
    fontSize: 14,
  },
});

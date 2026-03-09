import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGame } from '@/src/context/GameContext';

export default function HomeScreen() {
  const router = useRouter();
  const { joinRoom, loading, error } = useGame();
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const handleCreate = () => {
    if (!nickname.trim()) {
      Alert.alert('Error', 'Please enter a nickname');
      return;
    }
    router.push(`/create?nickname=${encodeURIComponent(nickname.trim())}`);
  };

  const handleJoin = async () => {
    if (!nickname.trim()) {
      Alert.alert('Error', 'Please enter a nickname');
      return;
    }
    if (!joinCode.trim() || joinCode.trim().length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit room code');
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
      <View style={styles.header}>
        <Text style={styles.title}>Same Page</Text>
        <Text style={styles.subtitle}>Think alike. Score together.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Nickname</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter nickname..."
            placeholderTextColor="#aaa"
            value={nickname}
            onChangeText={setNickname}
            maxLength={20}
            autoCapitalize="none"
          />
        </View>

        {!showJoin ? (
          <View style={styles.buttonGroup}>
            <Pressable style={styles.primaryButton} onPress={handleCreate}>
              <Text style={styles.primaryButtonText}>Create Room</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={() => setShowJoin(true)}>
              <Text style={styles.secondaryButtonText}>Join Room</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Room Code</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="0000"
                placeholderTextColor="#aaa"
                value={joinCode}
                onChangeText={setJoinCode}
                maxLength={4}
                keyboardType="number-pad"
                textAlign="center"
              />
            </View>
            <View style={styles.buttonGroup}>
              <Pressable style={styles.primaryButton} onPress={handleJoin} disabled={loading}>
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Joining...' : 'Join'}
                </Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => setShowJoin(false)}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </Pressable>
            </View>
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#2ecc71',
    fontWeight: '500',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#222',
  },
  codeInput: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 8,
    paddingVertical: 14,
  },
  buttonGroup: {
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#2ecc71',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#444',
    fontSize: 16,
    fontWeight: '500',
  },
  error: {
    color: '#e74c3c',
    marginTop: 14,
    textAlign: 'center',
    fontSize: 14,
  },
});

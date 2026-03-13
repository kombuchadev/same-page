import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGame } from '@/src/context/GameContext';
import { useTimer } from '@/src/hooks/useTimer';
import { TimerDisplay } from '@/src/components/TimerDisplay';

export default function GameScreen() {
  const { roomCode } = useLocalSearchParams<{ roomCode: string }>();
  const router = useRouter();
  const {
    room,
    players,
    isHost,
    hasSubmitted,
    submittedPlayerIds,
    submitAnswer,
    transitionToReveal,
    leaveRoom,
    error,
  } = useGame();

  const handleLeave = () => {
    Alert.alert('Leave Room', 'Are you sure you want to leave?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          await leaveRoom();
          router.replace('/home');
        }
      },
    ]);
  };

  const { secondsLeft, isExpired } = useTimer(room?.timerEndsAt ?? null);
  const [answer, setAnswer] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  // Navigate on phase change
  useEffect(() => {
    if (room?.phase === 'REVEAL') {
      router.replace(`/reveal/${roomCode}`);
    }
  }, [room?.phase]);

  // Host: auto-transition when timer expires
  useEffect(() => {
    if (isHost && isExpired && room?.phase === 'GUESSING' && !transitioning) {
      setTransitioning(true);
      transitionToReveal().finally(() => setTransitioning(false));
    }
  }, [isHost, isExpired, room?.phase, transitioning]);

  // Host: auto-transition when all connected players have submitted
  useEffect(() => {
    if (!isHost || !room || room.phase !== 'GUESSING' || transitioning) return;

    const connectedPlayerIds = Object.keys(players).filter((id) => players[id].connected);
    if (connectedPlayerIds.length === 0) return;

    const allSubmitted = connectedPlayerIds.every((id) => submittedPlayerIds.includes(id));
    if (allSubmitted) {
      setTransitioning(true);
      transitionToReveal().finally(() => setTransitioning(false));
    }
  }, [isHost, room, players, submittedPlayerIds, transitioning]);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    await submitAnswer(answer);
    setAnswer('');
  };

  if (!room) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.roundLabel}>
        Round {room.currentRound} of {room.totalRounds}
      </Text>

      <TimerDisplay secondsLeft={secondsLeft} isExpired={isExpired} />

      <View style={styles.promptBox}>
        <Text style={styles.prompt}>{room.currentPrompt}</Text>
      </View>

      {!hasSubmitted ? (
        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            placeholder="Type your answer..."
            value={answer}
            onChangeText={setAnswer}
            maxLength={100}
            autoCapitalize="none"
            autoFocus
            editable={!isExpired}
          />
          <Pressable
            style={[styles.submitButton, (!answer.trim() || isExpired) && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!answer.trim() || isExpired}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.waitingSection}>
          <Text style={styles.waitingText}>Answer submitted!</Text>
          <Text style={styles.waitingSubtext}>Waiting for other players...</Text>

          <View style={styles.playerStatus}>
            {Object.entries(players).map(([id, player]) => {
              const submitted = submittedPlayerIds.includes(id);
              return (
                <View key={id} style={styles.playerStatusRow}>
                  <Text style={[styles.playerStatusIcon, submitted ? styles.iconDone : styles.iconPending]}>
                    {submitted ? '✓' : '…'}
                  </Text>
                  <Text style={[styles.playerStatusText, !submitted && styles.playerStatusPending]}>
                    {player.nickname}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.leaveButton} onPress={handleLeave}>
        <Text style={styles.leaveButtonText}>Leave Room</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  loading: {
    textAlign: 'center',
    marginTop: 48,
    color: '#999',
  },
  roundLabel: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  promptBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 24,
    marginVertical: 24,
    alignItems: 'center',
  },
  prompt: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputSection: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 14,
    fontSize: 18,
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitingSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  waitingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2ecc71',
  },
  waitingSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  playerStatus: {
    marginTop: 16,
    width: '100%',
  },
  playerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  playerStatusIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 20,
    textAlign: 'center',
  },
  iconDone: {
    color: '#2ecc71',
  },
  iconPending: {
    color: '#bdc3c7',
  },
  playerStatusText: {
    fontSize: 15,
    color: '#333',
  },
  playerStatusPending: {
    color: '#aaa',
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 16,
  },
  leaveButton: {
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  leaveButtonText: {
    color: '#e74c3c',
    fontSize: 16,
  },
});

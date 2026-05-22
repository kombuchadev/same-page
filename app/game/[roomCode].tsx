import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGame } from '@/src/context/GameContext';
import { useTimer } from '@/src/hooks/useTimer';
import { TimerDisplay } from '@/src/components/TimerDisplay';
import { DuoButton } from '@/src/components/DuoButton';
import { Colors, Radius, FontFamily } from '@/constants/theme';

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

  const { secondsLeft, isExpired } = useTimer(room?.timerEndsAt ?? null);
  const [answer, setAnswer] = useState('');
  const [focused, setFocused] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (room?.phase === 'REVEAL') {
      router.replace(`/reveal/${roomCode}`);
    }
  }, [room?.phase]);

  useEffect(() => {
    if (isHost && isExpired && room?.phase === 'GUESSING' && !transitioning) {
      setTransitioning(true);
      transitionToReveal().finally(() => setTransitioning(false));
    }
  }, [isHost, isExpired, room?.phase, transitioning]);

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

  const handleLeave = () => {
    Alert.alert('Leave Room', 'Are you sure you want to leave?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          await leaveRoom();
          router.replace('/home');
        },
      },
    ]);
  };

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.inner}>
        {/* Round label */}
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>
            ROUND {room.currentRound} OF {room.totalRounds}
          </Text>
        </View>

        {/* Timer */}
        <TimerDisplay secondsLeft={secondsLeft} isExpired={isExpired} />

        {/* Prompt */}
        <View style={styles.promptCard}>
          <Text style={styles.prompt}>{room.currentPrompt}</Text>
        </View>

        {!hasSubmitted ? (
          <View style={styles.inputSection}>
            <TextInput
              style={[styles.input, focused && styles.inputFocused]}
              placeholder="Type your answer…"
              placeholderTextColor={Colors.textDisabled}
              value={answer}
              onChangeText={setAnswer}
              maxLength={100}
              autoCapitalize="none"
              autoFocus
              editable={!isExpired}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            <DuoButton
              label="Submit"
              onPress={handleSubmit}
              disabled={!answer.trim() || isExpired}
            />
          </View>
        ) : (
          <View style={styles.waitingSection}>
            <View style={styles.submittedBadge}>
              <Text style={styles.submittedText}>✓ Answer submitted!</Text>
            </View>
            <Text style={styles.waitingSubtext}>Waiting for other players…</Text>

            <View style={styles.playerStatusList}>
              {Object.entries(players).map(([id, player]) => {
                const submitted = submittedPlayerIds.includes(id);
                return (
                  <View
                    key={id}
                    style={[styles.playerStatusRow, submitted && styles.playerStatusRowDone]}
                  >
                    <Text
                      style={[
                        styles.playerStatusIcon,
                        submitted ? styles.iconDone : styles.iconPending,
                      ]}
                    >
                      {submitted ? '✓' : '○'}
                    </Text>
                    <Text
                      style={[styles.playerStatusName, !submitted && styles.playerStatusPending]}
                    >
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
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
  },
  inner: {
    flex: 1,
    padding: 24,
  },
  loading: {
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 48,
    color: Colors.textSecondary,
  },
  roundBadge: {
    alignSelf: 'center',
    backgroundColor: Colors.blue,
    borderRadius: Radius.badge,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 12,
    marginTop: 4,
  },
  roundText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  promptCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 24,
    marginVertical: 20,
    alignItems: 'center',
  },
  prompt: {
    fontFamily: FontFamily.extraBold,
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 30,
  },
  inputSection: {
    gap: 14,
  },
  input: {
    fontFamily: FontFamily.semiBold,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radius.input,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  inputFocused: {
    borderColor: Colors.blue,
  },
  waitingSection: {
    alignItems: 'center',
  },
  submittedBadge: {
    backgroundColor: Colors.cardCorrect,
    borderRadius: Radius.badge,
    borderWidth: 2,
    borderColor: Colors.primaryGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 12,
  },
  submittedText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: Colors.primaryGreen,
  },
  waitingSubtext: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  playerStatusList: {
    width: '100%',
    gap: 8,
  },
  playerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  playerStatusRowDone: {
    borderColor: Colors.primaryGreen,
    backgroundColor: Colors.cardCorrect,
  },
  playerStatusIcon: {
    fontFamily: FontFamily.extraBold,
    fontSize: 16,
    width: 20,
    textAlign: 'center',
  },
  iconDone: {
    color: Colors.primaryGreen,
  },
  iconPending: {
    color: Colors.textDisabled,
  },
  playerStatusName: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  playerStatusPending: {
    color: Colors.textDisabled,
  },
  error: {
    fontFamily: FontFamily.semiBold,
    color: Colors.red,
    textAlign: 'center',
    marginTop: 16,
  },
  leaveButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  leaveButtonText: {
    fontFamily: FontFamily.bold,
    color: Colors.red,
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

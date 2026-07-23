import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGame } from '@/src/context/GameContext';
import { ScoreBoard } from '@/src/components/ScoreBoard';
import { useEffect } from 'react';
import { DuoButton } from '@/src/components/DuoButton';
import { Colors, Radius, FontFamily } from '@/constants/theme';
import { GameLoadingScreen } from '@/src/components/GameLoadingScreen';
import { LOADING_MESSAGES } from '@/src/hooks/useLoadingMessages';

export default function ResultsScreen() {
  const { roomCode } = useLocalSearchParams<{ roomCode: string }>();
  const router = useRouter();
  const { room, players, isHost, myUid, playAgain, leaveRoom, error } = useGame();

  useEffect(() => {
    if (room?.phase === 'LOBBY') router.replace(`/lobby/${roomCode}`);
  }, [room?.phase, roomCode, router]);

  const handlePlayAgain = async () => {
    await playAgain();
  };
  const handleLeave = async () => {
    await leaveRoom();
    router.replace('/home');
  };

  if (!room) {
    return <GameLoadingScreen messages={LOADING_MESSAGES.generic} />;
  }

  const sortedPlayers = Object.entries(players).sort(([, a], [, b]) => b.score - a.score);
  const topScore = sortedPlayers[0]?.[1]?.score ?? 0;
  const winners = sortedPlayers.filter(([, p]) => p.score === topScore);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Title */}
        <Text style={styles.title}>Game Over! 🏆</Text>

        {/* Winner card */}
        <View style={styles.winnerCard}>
          <Text style={styles.winnerLabel}>{winners.length === 1 ? 'WINNER' : 'TIE'}</Text>
          <Text style={styles.winnerName}>{winners.map(([, p]) => p.nickname).join(' & ')}</Text>
          <View style={styles.scorePill}>
            <Text style={styles.scorePillText}>{topScore} pts</Text>
          </View>
        </View>

        {/* Scoreboard */}
        <View style={styles.scoreSection}>
          <Text style={styles.sectionTitle}>FINAL STANDINGS</Text>
          <View style={styles.scoreCard}>
            <ScoreBoard players={players} myUid={myUid} showRank />
          </View>
        </View>

        {isHost && (
          <DuoButton label="Play Again" onPress={handlePlayAgain} style={styles.playAgainBtn} />
        )}

        {!isHost && <Text style={styles.waitingText}>Waiting for host…</Text>}

        <Pressable style={styles.leaveButton} onPress={handleLeave}>
          <Text style={styles.leaveButtonText}>Leave</Text>
        </Pressable>

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
  },
  scroll: {
    padding: 24,
    paddingBottom: 48,
  },
  loading: {
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 48,
    color: Colors.textSecondary,
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: 32,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  winnerCard: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: Colors.yellow,
    padding: 28,
    marginBottom: 24,
  },
  winnerLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Colors.yellow,
    letterSpacing: 2,
    marginBottom: 8,
  },
  winnerName: {
    fontFamily: FontFamily.extraBold,
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  scorePill: {
    backgroundColor: Colors.yellow,
    borderRadius: Radius.badge,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  scorePillText: {
    fontFamily: FontFamily.extraBold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  scoreSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  scoreCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  playAgainBtn: {
    marginBottom: 12,
  },
  waitingText: {
    fontFamily: FontFamily.semiBold,
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  leaveButton: {
    padding: 12,
    alignItems: 'center',
  },
  leaveButtonText: {
    fontFamily: FontFamily.bold,
    color: Colors.red,
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  error: {
    fontFamily: FontFamily.semiBold,
    color: Colors.red,
    textAlign: 'center',
    marginTop: 8,
  },
});

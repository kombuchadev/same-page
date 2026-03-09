import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGame } from '@/src/context/GameContext';
import { ScoreBoard } from '@/src/components/ScoreBoard';
import { useEffect } from 'react';

export default function ResultsScreen() {
  const { roomCode } = useLocalSearchParams<{ roomCode: string }>();
  const router = useRouter();
  const { room, players, isHost, myUid, playAgain, leaveRoom, error } = useGame();

  // Navigate back to lobby if host restarts
  useEffect(() => {
    if (room?.phase === 'LOBBY') {
      router.replace(`/lobby/${roomCode}`);
    }
  }, [room?.phase]);

  const handlePlayAgain = async () => {
    await playAgain();
  };

  const handleLeave = async () => {
    await leaveRoom();
    router.replace('/home');
  };

  if (!room) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  // Find winner(s)
  const sortedPlayers = Object.entries(players).sort(([, a], [, b]) => b.score - a.score);
  const topScore = sortedPlayers[0]?.[1]?.score ?? 0;
  const winners = sortedPlayers.filter(([, p]) => p.score === topScore);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game Over!</Text>

      <View style={styles.winnerBox}>
        {winners.length === 1 ? (
          <>
            <Text style={styles.winnerLabel}>Winner</Text>
            <Text style={styles.winnerName}>{winners[0][1].nickname}</Text>
            <Text style={styles.winnerScore}>{topScore} pts</Text>
          </>
        ) : (
          <>
            <Text style={styles.winnerLabel}>Tie!</Text>
            <Text style={styles.winnerName}>
              {winners.map(([, p]) => p.nickname).join(' & ')}
            </Text>
            <Text style={styles.winnerScore}>{topScore} pts</Text>
          </>
        )}
      </View>

      <View style={styles.scoreSection}>
        <Text style={styles.sectionTitle}>Final Standings</Text>
        <ScoreBoard players={players} myUid={myUid} showRank />
      </View>

      {isHost && (
        <Pressable style={styles.playAgainButton} onPress={handlePlayAgain}>
          <Text style={styles.playAgainText}>Play Again</Text>
        </Pressable>
      )}

      {!isHost && (
        <Text style={styles.waitingText}>Waiting for host...</Text>
      )}

      <Pressable style={styles.leaveButton} onPress={handleLeave}>
        <Text style={styles.leaveButtonText}>Leave</Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  winnerBox: {
    alignItems: 'center',
    backgroundColor: '#fef9e7',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#f1c40f',
  },
  winnerLabel: {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  winnerName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  winnerScore: {
    fontSize: 20,
    color: '#2ecc71',
    fontWeight: '600',
  },
  scoreSection: {
    flex: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  playAgainButton: {
    backgroundColor: '#2ecc71',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  playAgainText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitingText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 12,
  },
  leaveButton: {
    padding: 12,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#e74c3c',
    fontSize: 16,
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 8,
  },
});

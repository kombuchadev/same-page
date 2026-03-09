import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGame } from '@/src/context/GameContext';
import { ScoreBoard } from '@/src/components/ScoreBoard';
import type { RevealedAnswer } from '@/src/types/game';
import { Alert } from 'react-native';

export default function RevealScreen() {
  const { roomCode } = useLocalSearchParams<{ roomCode: string }>();
  const router = useRouter();
  const {
    room,
    players,
    revealedAnswers,
    isHost,
    myUid,
    nextRound,
    leaveRoom,
    error,
  } = useGame();

  const handleLeave = async () => {
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

  // Navigate on phase change
  useEffect(() => {
    if (room?.phase === 'GUESSING') {
      router.replace(`/game/${roomCode}`);
    } else if (room?.phase === 'RESULTS') {
      router.replace(`/results/${roomCode}`);
    }
  }, [room?.phase]);

  const handleNextRound = async () => {
    await nextRound();
  };

  if (!room || !revealedAnswers) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Calculating scores...</Text>
      </View>
    );
  }

  // Group revealed answers by cluster (exclude no-answer placeholder)
  const clusters = new Map<string, { label: string; entries: Array<{ playerId: string; answer: RevealedAnswer }> }>();
  const noAnswerPlayers: Array<{ playerId: string; answer: RevealedAnswer }> = [];

  for (const [playerId, revealed] of Object.entries(revealedAnswers)) {
    if (revealed.clusterLabel === '__no_answer__') {
      noAnswerPlayers.push({ playerId, answer: revealed });
      continue;
    }
    const key = revealed.clusterLabel;
    if (!clusters.has(key)) {
      clusters.set(key, { label: key, entries: [] });
    }
    clusters.get(key)!.entries.push({ playerId, answer: revealed });
  }

  const isLastRound = room.currentRound >= room.totalRounds;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Answers Revealed!</Text>
      <Text style={styles.roundLabel}>
        Round {room.currentRound} of {room.totalRounds}
      </Text>

      <View style={styles.promptBox}>
        <Text style={styles.prompt}>{room.currentPrompt}</Text>
      </View>

      <View style={styles.clustersSection}>
        {Array.from(clusters.values()).map((cluster) => {
          const isConsensus = cluster.entries.length > 1;
          return (
            <View
              key={cluster.label}
              style={[styles.clusterCard, isConsensus && styles.consensusCard]}
            >
              <View style={styles.clusterHeader}>
                <Text style={styles.clusterLabel}>
                  {isConsensus ? '+1' : '0'}
                </Text>
                {isConsensus && (
                  <Text style={styles.consensusBadge}>Consensus!</Text>
                )}
              </View>
              {cluster.entries.map(({ playerId, answer }) => {
                const player = players[playerId];
                return (
                  <View key={playerId} style={styles.answerRow}>
                    <Text style={styles.playerName}>
                      {player?.nickname ?? 'Unknown'}
                      {playerId === myUid ? ' (You)' : ''}
                    </Text>
                    <Text style={styles.answerText}>"{answer.answer}"</Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      <View style={styles.scoreSection}>
        <Text style={styles.sectionTitle}>Current Scores</Text>
        <ScoreBoard players={players} myUid={myUid} />
      </View>

      {isHost && (
        <Pressable style={styles.nextButton} onPress={handleNextRound}>
          <Text style={styles.nextButtonText}>
            {isLastRound ? 'See Final Results' : 'Next Round'}
          </Text>
        </Pressable>
      )}

      {noAnswerPlayers.length > 0 && (
        <View style={[styles.clusterCard, { marginBottom: 24 }]}>
          <Text style={[styles.clusterLabel, { color: '#999' }]}>0 — No answer</Text>
          {noAnswerPlayers.map(({ playerId }) => (
            <Text key={playerId} style={[styles.playerName, { color: '#999' }]}>
              {players[playerId]?.nickname ?? 'Unknown'}
              {playerId === myUid ? ' (You)' : ''}
            </Text>
          ))}
        </View>
      )}

      {!isHost && (
        <Text style={styles.waitingText}>
          Waiting for host to continue...
        </Text>
      )}

      <Pressable style={styles.leaveButton} onPress={handleLeave}>
        <Text style={styles.leaveButtonText}>Leave Room</Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.bottomPadding} />
    </ScrollView>
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  roundLabel: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  promptBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  prompt: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  clustersSection: {
    gap: 12,
    marginBottom: 24,
  },
  clusterCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  consensusCard: {
    borderColor: '#2ecc71',
    backgroundColor: '#f0faf4',
  },
  clusterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  clusterLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  consensusBadge: {
    fontSize: 12,
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  playerName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  answerText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  scoreSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  nextButton: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitingText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 12,
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 8,
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
  bottomPadding: {
    height: 40,
  },
});

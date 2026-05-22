import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGame } from '@/src/context/GameContext';
import { ScoreBoard } from '@/src/components/ScoreBoard';
import type { RevealedAnswer } from '@/src/types/game';
import { DuoButton } from '@/src/components/DuoButton';
import { Colors, Radius, FontFamily } from '@/constants/theme';
import { GameLoadingScreen } from '@/src/components/GameLoadingScreen';
import { LOADING_MESSAGES } from '@/src/hooks/useLoadingMessages';

export default function RevealScreen() {
  const { roomCode } = useLocalSearchParams<{ roomCode: string }>();
  const router = useRouter();
  const { room, players, revealedAnswers, isHost, myUid, nextRound, leaveRoom, error } = useGame();

  const handleLeave = async () => {
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

  useEffect(() => {
    if (room?.phase === 'GUESSING') router.replace(`/game/${roomCode}`);
    else if (room?.phase === 'RESULTS') router.replace(`/results/${roomCode}`);
  }, [room?.phase, roomCode, router]);

  const handleNextRound = async () => {
    await nextRound();
  };

  if (!room || !revealedAnswers) {
    return <GameLoadingScreen messages={LOADING_MESSAGES.calculating} />;
  }

  const clusters = new Map<
    string,
    { label: string; entries: { playerId: string; answer: RevealedAnswer }[] }
  >();
  const noAnswerPlayers: { playerId: string; answer: RevealedAnswer }[] = [];

  for (const [playerId, revealed] of Object.entries(revealedAnswers)) {
    if (revealed.clusterLabel === '__no_answer__') {
      noAnswerPlayers.push({ playerId, answer: revealed });
      continue;
    }
    const key = revealed.clusterLabel;
    if (!clusters.has(key)) clusters.set(key, { label: key, entries: [] });
    clusters.get(key)!.entries.push({ playerId, answer: revealed });
  }

  const isLastRound = room.currentRound >= room.totalRounds;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>
            ROUND {room.currentRound} OF {room.totalRounds}
          </Text>
        </View>
        <Text style={styles.title}>Answers Revealed!</Text>

        {/* Prompt recap */}
        <View style={styles.promptCard}>
          <Text style={styles.prompt}>{room.currentPrompt}</Text>
        </View>

        {/* Clusters */}
        <View style={styles.clustersSection}>
          {Array.from(clusters.values()).map((cluster) => {
            const isConsensus = cluster.entries.length > 1;
            return (
              <View
                key={cluster.label}
                style={[
                  styles.clusterCard,
                  isConsensus ? styles.clusterCardConsensus : styles.clusterCardSolo,
                ]}
              >
                <View style={styles.clusterHeader}>
                  <View
                    style={[
                      styles.pointsBadge,
                      isConsensus ? styles.pointsBadgeGreen : styles.pointsBadgeGray,
                    ]}
                  >
                    <Text style={styles.pointsText}>{isConsensus ? '+1' : '0'}</Text>
                  </View>
                  {isConsensus && (
                    <View style={styles.consensusBadge}>
                      <Text style={styles.consensusText}>🎉 Consensus!</Text>
                    </View>
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
                      <Text style={styles.answerText}>&ldquo;{answer.answer}&rdquo;</Text>
                    </View>
                  );
                })}
              </View>
            );
          })}

          {noAnswerPlayers.length > 0 && (
            <View style={[styles.clusterCard, styles.clusterCardNoAnswer]}>
              <View style={styles.clusterHeader}>
                <View style={styles.pointsBadgeGray}>
                  <Text style={styles.pointsText}>0</Text>
                </View>
                <Text style={styles.noAnswerLabel}>No answer</Text>
              </View>
              {noAnswerPlayers.map(({ playerId }) => (
                <Text key={playerId} style={styles.noAnswerName}>
                  {players[playerId]?.nickname ?? 'Unknown'}
                  {playerId === myUid ? ' (You)' : ''}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Scoreboard */}
        <View style={styles.scoreSection}>
          <Text style={styles.sectionTitle}>CURRENT SCORES</Text>
          <View style={styles.scoreCard}>
            <ScoreBoard players={players} myUid={myUid} />
          </View>
        </View>

        {isHost && (
          <DuoButton
            label={isLastRound ? 'See Final Results' : 'Next Round'}
            onPress={handleNextRound}
            style={styles.nextBtn}
          />
        )}

        {!isHost && <Text style={styles.waitingText}>Waiting for host to continue…</Text>}

        <Pressable style={styles.leaveButton} onPress={handleLeave}>
          <Text style={styles.leaveButtonText}>Leave Room</Text>
        </Pressable>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={{ height: 40 }} />
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
  },
  loading: {
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 48,
    color: Colors.textSecondary,
    fontSize: 16,
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
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: 28,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  promptCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  prompt: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  clustersSection: {
    gap: 12,
    marginBottom: 24,
  },
  clusterCard: {
    borderWidth: 2,
    borderRadius: Radius.card,
    padding: 14,
  },
  clusterCardConsensus: {
    borderColor: Colors.primaryGreen,
    backgroundColor: Colors.cardCorrect,
  },
  clusterCardSolo: {
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  clusterCardNoAnswer: {
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundAlt,
  },
  clusterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  pointsBadge: {
    borderRadius: Radius.badge,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pointsBadgeGreen: {
    backgroundColor: Colors.primaryGreen,
  },
  pointsBadgeGray: {
    backgroundColor: Colors.textDisabled,
    borderRadius: Radius.badge,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pointsText: {
    fontFamily: FontFamily.extraBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  consensusBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.badge,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.primaryGreen,
  },
  consensusText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Colors.primaryGreen,
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  playerName: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  answerText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  noAnswerLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: Colors.textDisabled,
  },
  noAnswerName: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textDisabled,
    paddingVertical: 3,
  },
  scoreSection: {
    marginBottom: 20,
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
  nextBtn: {
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
    marginBottom: 8,
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

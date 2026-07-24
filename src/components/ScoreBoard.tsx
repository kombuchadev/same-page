import { View, Text, StyleSheet } from 'react-native';
import type { Player } from '@/src/types/game';
import { Colors, Radius, FontFamily } from '@/constants/theme';

interface ScoreBoardProps {
  players: Record<string, Player>;
  myUid: string | null;
  showRank?: boolean;
}

const RANK_COLORS = ['#FFC800', '#AFAFAF', '#FF9600'];

export function ScoreBoard({ players, myUid, showRank = false }: ScoreBoardProps) {
  const sorted = Object.entries(players).sort(([, a], [, b]) => b.score - a.score);

  return (
    <View>
      {sorted.map(([id, player], index) => {
        const isMe = id === myUid;
        const rankColor = RANK_COLORS[index] ?? Colors.textDisabled;
        return (
          <View key={id} style={[styles.row, isMe && styles.myRow]}>
            {showRank && (
              <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
            )}
            <Text style={[styles.name, isMe && styles.myName]}>
              {player.nickname}
              {isMe ? ' (You)' : ''}
            </Text>
            <View
              style={[
                styles.scorePill,
                { backgroundColor: isMe ? Colors.primaryGreen : Colors.backgroundAlt },
              ]}
            >
              <Text style={[styles.scoreText, { color: isMe ? '#FFFFFF' : Colors.textPrimary }]}>
                {player.score} pts
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  myRow: {
    backgroundColor: Colors.cardSelected,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.badge,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontFamily: FontFamily.extraBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  name: {
    fontFamily: FontFamily.bold,
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  myName: {
    color: Colors.blue,
  },
  scorePill: {
    borderRadius: Radius.badge,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  scoreText: {
    fontFamily: FontFamily.extraBold,
    fontSize: 14,
  },
});

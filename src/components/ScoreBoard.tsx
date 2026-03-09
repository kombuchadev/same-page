import { View, Text, FlatList, StyleSheet } from 'react-native';
import type { Player } from '@/src/types/game';

interface ScoreBoardProps {
  players: Record<string, Player>;
  myUid: string | null;
  showRank?: boolean;
}

export function ScoreBoard({ players, myUid, showRank = false }: ScoreBoardProps) {
  const sorted = Object.entries(players).sort(([, a], [, b]) => b.score - a.score);

  return (
    <FlatList
      data={sorted}
      keyExtractor={([id]) => id}
      renderItem={({ item: [id, player], index }) => (
        <View style={[styles.row, id === myUid && styles.myRow]}>
          {showRank && (
            <Text style={styles.rank}>#{index + 1}</Text>
          )}
          <Text style={styles.name}>{player.nickname}</Text>
          <Text style={styles.score}>{player.score} pts</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  myRow: {
    backgroundColor: '#e8f4fd',
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 40,
    color: '#666',
  },
  name: {
    flex: 1,
    fontSize: 16,
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
});

import { View, Text, FlatList, StyleSheet } from 'react-native';
import type { Player } from '@/src/types/game';

interface PlayerListProps {
  players: Record<string, Player>;
  hostUid: string;
  myUid: string | null;
}

export function PlayerList({ players, hostUid, myUid }: PlayerListProps) {
  const entries = Object.entries(players);

  return (
    <FlatList
      data={entries}
      keyExtractor={([id]) => id}
      renderItem={({ item: [id, player] }) => (
        <View style={styles.row}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, !player.connected && styles.disconnected]}>
              {player.nickname}
            </Text>
            {id === hostUid && <Text style={styles.badge}> (Host)</Text>}
            {id === myUid && <Text style={styles.badge}> (You)</Text>}
          </View>
          {!player.connected && (
            <Text style={styles.disconnectedLabel}>Disconnected</Text>
          )}
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No players yet</Text>}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  disconnected: {
    color: '#999',
  },
  badge: {
    fontSize: 12,
    color: '#666',
  },
  disconnectedLabel: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    padding: 16,
  },
});

import { View, Text, FlatList, StyleSheet } from 'react-native';
import type { Player } from '@/src/types/game';
import { Colors, Radius, FontFamily } from '@/constants/theme';

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
        <View style={[styles.row, !player.connected && styles.rowDisconnected]}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, !player.connected && styles.nameDisconnected]}>
              {player.nickname}
            </Text>
            {id === hostUid && (
              <View style={[styles.badge, styles.hostBadge]}>
                <Text style={styles.badgeText}>HOST</Text>
              </View>
            )}
            {id === myUid && (
              <View style={[styles.badge, styles.youBadge]}>
                <Text style={[styles.badgeText, styles.youBadgeText]}>YOU</Text>
              </View>
            )}
          </View>
          {!player.connected && <Text style={styles.disconnectedLabel}>Disconnected</Text>}
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No players yet</Text>}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowDisconnected: {
    opacity: 0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  nameDisconnected: {
    color: Colors.textDisabled,
  },
  badge: {
    borderRadius: Radius.badge,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hostBadge: {
    backgroundColor: Colors.yellow,
  },
  youBadge: {
    backgroundColor: Colors.blue,
  },
  badgeText: {
    fontFamily: FontFamily.extraBold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  youBadgeText: {
    color: '#FFFFFF',
  },
  disconnectedLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.red,
    marginTop: 2,
  },
  empty: {
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    color: Colors.textDisabled,
    padding: 16,
  },
});

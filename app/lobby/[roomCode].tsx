import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGame } from '@/src/context/GameContext';
import { PlayerList } from '@/src/components/PlayerList';
import { PACKS, PACK_ICONS, getPackById } from '@/src/data/packs';

const TIMER_OPTIONS = [
  { label: '15 sec', value: 15 },
  { label: '30 sec', value: 30 },
  { label: '45 sec', value: 45 },
  { label: '60 sec', value: 60 },
];

export default function LobbyScreen() {
  const { roomCode } = useLocalSearchParams<{ roomCode: string }>();
  const router = useRouter();
  const { room, players, isHost, myUid, startGame, leaveRoom, updateRoomSettings, error } = useGame();

  // Settings modal state (mirrors room settings while editing)
  const [editVisible, setEditVisible] = useState(false);
  const [editPackIds, setEditPackIds] = useState<string[]>(['starter_pack']);
  const [editDuration, setEditDuration] = useState(30);
  const [saving, setSaving] = useState(false);

  const playerCount = Object.keys(players).length;

  // Navigate when game starts
  useEffect(() => {
    if (room?.phase === 'GUESSING') {
      router.replace(`/game/${roomCode}`);
    }
  }, [room?.phase]);

  const openEdit = () => {
    if (!room) return;
    setEditPackIds([...room.packIds]);
    setEditDuration(room.roundDuration);
    setEditVisible(true);
  };

  const togglePack = (id: string) => {
    setEditPackIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter((p) => p !== id);
      }
      return [...prev, id];
    });
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await updateRoomSettings({ packIds: editPackIds, roundDuration: editDuration });
      setEditVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStart = async () => {
    try {
      await startGame();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleLeave = async () => {
    await leaveRoom();
    router.replace('/home');
  };

  if (!room) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading room...</Text>
      </View>
    );
  }

  const selectedPacks = room.packIds.map((id) => getPackById(id)).filter(Boolean);
  const totalQuestions = selectedPacks.reduce((sum, p) => sum + (p?.questions.length ?? 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Lobby</Text>

        {/* Room code */}
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Room Code</Text>
          <Text style={styles.code}>{roomCode}</Text>
          <Text style={styles.codeHint}>Share this with friends</Text>
        </View>

        {/* Settings row — tappable for host */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsLabel}>Game Settings</Text>
            {isHost && (
              <Pressable onPress={openEdit} style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            style={styles.settingsCard}
            onPress={isHost ? openEdit : undefined}
            disabled={!isHost}
          >
            {/* Timer chip */}
            <View style={styles.settingRow}>
              <Text style={styles.settingIcon}>⏱</Text>
              <Text style={styles.settingValue}>{room.roundDuration} seconds per round</Text>
            </View>

            <View style={styles.divider} />

            {/* Packs */}
            <View style={styles.settingRow}>
              <Text style={styles.settingIcon}>🃏</Text>
              <View style={styles.packTagsWrap}>
                {selectedPacks.map((p) => (
                  <View key={p!.id} style={styles.packTag}>
                    <Text style={styles.packTagText}>
                      {PACK_ICONS[p!.id]} {p!.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.totalQuestions}>{totalQuestions} questions in pool</Text>

            {isHost && (
              <Text style={styles.tapHint}>Tap to edit settings</Text>
            )}
          </Pressable>
        </View>

        {/* Players */}
        <View style={styles.playersSection}>
          <Text style={styles.sectionTitle}>Players ({playerCount})</Text>
          <PlayerList players={players} hostUid={room.hostUid} myUid={myUid} />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.footer}>
        {isHost ? (
          <Pressable
            style={[styles.startButton, playerCount < 2 && styles.startButtonDisabled]}
            onPress={handleStart}
            disabled={playerCount < 2}
          >
            <Text style={styles.startButtonText}>
              {playerCount < 2 ? 'Need 2+ players to start' : 'Start Game'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>Waiting for host to start...</Text>
          </View>
        )}

        <Pressable style={styles.leaveButton} onPress={handleLeave}>
          <Text style={styles.leaveButtonText}>Leave Room</Text>
        </Pressable>
      </View>

      {/* Settings Edit Modal */}
      <Modal
        visible={editVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditVisible(false)}
      >
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Settings</Text>
            <Pressable onPress={() => setEditVisible(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </Pressable>
          </View>

          {/* Timer */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏱  Time Per Round</Text>
            <View style={styles.timerRow}>
              {TIMER_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.timerChip, editDuration === opt.value && styles.timerChipActive]}
                  onPress={() => setEditDuration(opt.value)}
                >
                  <Text style={[styles.timerChipText, editDuration === opt.value && styles.timerChipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Pack multi-select */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🃏  Question Packs</Text>
              <Text style={styles.sectionMeta}>
                {PACKS.filter((p) => editPackIds.includes(p.id)).reduce(
                  (s, p) => s + p.questions.length,
                  0
                )}{' '}
                questions
              </Text>
            </View>
            <Text style={styles.sectionHint}>Select one or more packs</Text>
            {PACKS.map((pack) => {
              const selected = editPackIds.includes(pack.id);
              return (
                <Pressable
                  key={pack.id}
                  style={[styles.packCard, selected && styles.packCardActive]}
                  onPress={() => togglePack(pack.id)}
                >
                  <View style={styles.packCardInner}>
                    <Text style={styles.packIcon}>{PACK_ICONS[pack.id] ?? '🎮'}</Text>
                    <View style={styles.packInfo}>
                      <Text style={[styles.packName, selected && styles.packNameActive]}>
                        {pack.name}
                      </Text>
                      <Text style={styles.packDescription}>{pack.description}</Text>
                      <Text style={styles.packCount}>{pack.questions.length} questions</Text>
                    </View>
                    <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                      {selected && <Text style={styles.checkmarkText}>✓</Text>}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveSettings}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
          </Pressable>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scroll: {
    padding: 24,
    paddingBottom: 8,
  },
  loading: {
    textAlign: 'center',
    marginTop: 48,
    color: '#ffffff66',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  codeBox: {
    alignItems: 'center',
    backgroundColor: '#ffffff0f',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffffff15',
  },
  codeLabel: {
    fontSize: 12,
    color: '#ffffff66',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  code: {
    fontSize: 44,
    fontWeight: 'bold',
    letterSpacing: 10,
    color: '#2ecc71',
    marginVertical: 4,
  },
  codeHint: {
    fontSize: 12,
    color: '#ffffff44',
  },
  settingsSection: {
    marginBottom: 20,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingsLabel: {
    fontSize: 14,
    color: '#ffffff66',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#2ecc7122',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2ecc7155',
  },
  editButtonText: {
    color: '#2ecc71',
    fontSize: 13,
    fontWeight: '700',
  },
  settingsCard: {
    backgroundColor: '#ffffff0d',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffffff15',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  settingIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 1,
  },
  settingValue: {
    fontSize: 15,
    color: '#ffffffcc',
    fontWeight: '500',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#ffffff15',
    marginVertical: 10,
  },
  packTagsWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  packTag: {
    backgroundColor: '#2ecc7120',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2ecc7133',
  },
  packTagText: {
    fontSize: 12,
    color: '#2ecc71',
    fontWeight: '600',
  },
  totalQuestions: {
    fontSize: 12,
    color: '#ffffff44',
    marginTop: 10,
    textAlign: 'right',
  },
  tapHint: {
    fontSize: 11,
    color: '#ffffff33',
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
  playersSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff99',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ffffff10',
  },
  startButton: {
    backgroundColor: '#2ecc71',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#ffffff22',
    shadowOpacity: 0,
    elevation: 0,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  waitingBox: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 10,
  },
  waitingText: {
    color: '#ffffff66',
    fontSize: 15,
  },
  leaveButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  leaveButtonText: {
    color: '#e74c3c',
    fontSize: 15,
    fontWeight: '500',
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },

  // ── Settings modal ──────────────────────────────────────────────────
  modal: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  modalContent: {
    padding: 24,
    paddingBottom: 48,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#ffffff99',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionMeta: {
    fontSize: 13,
    color: '#2ecc71',
    fontWeight: '600',
  },
  sectionHint: {
    fontSize: 13,
    color: '#ffffff55',
    marginBottom: 14,
  },
  timerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timerChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff22',
    backgroundColor: '#ffffff10',
    alignItems: 'center',
  },
  timerChipActive: {
    borderColor: '#2ecc71',
    backgroundColor: '#2ecc7120',
  },
  timerChipText: {
    color: '#ffffff88',
    fontSize: 14,
    fontWeight: '600',
  },
  timerChipTextActive: {
    color: '#2ecc71',
  },
  packCard: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ffffff15',
    backgroundColor: '#ffffff08',
    marginBottom: 12,
  },
  packCardActive: {
    borderColor: '#2ecc71',
    backgroundColor: '#2ecc7112',
  },
  packCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  packIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  packInfo: {
    flex: 1,
  },
  packName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffffcc',
    marginBottom: 3,
  },
  packNameActive: {
    color: '#ffffff',
  },
  packDescription: {
    fontSize: 13,
    color: '#ffffff66',
    lineHeight: 18,
    marginBottom: 4,
  },
  packCount: {
    fontSize: 11,
    color: '#2ecc7199',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff33',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkboxActive: {
    backgroundColor: '#2ecc71',
    borderColor: '#2ecc71',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGame } from '@/src/context/GameContext';
import { PlayerList } from '@/src/components/PlayerList';
import { PACKS, PACK_ICONS, getPackById } from '@/src/data/packs';
import { DuoButton } from '@/src/components/DuoButton';
import { Colors, Radius, FontFamily } from '@/constants/theme';
import { GameLoadingScreen } from '@/src/components/GameLoadingScreen';
import { LOADING_MESSAGES } from '@/src/hooks/useLoadingMessages';

const TIMER_OPTIONS = [
  { label: '15 sec', value: 15 },
  { label: '30 sec', value: 30 },
  { label: '45 sec', value: 45 },
  { label: '60 sec', value: 60 },
];

const ROUNDS_OPTIONS = [
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '15', value: 15 },
  { label: '20', value: 20 },
];

export default function LobbyScreen() {
  const { roomCode } = useLocalSearchParams<{ roomCode: string }>();
  const router = useRouter();
  const { room, players, isHost, myUid, startGame, leaveRoom, updateRoomSettings, error } =
    useGame();

  const [editVisible, setEditVisible] = useState(false);
  const [editPackIds, setEditPackIds] = useState<string[]>(['starter_pack']);
  const [editDuration, setEditDuration] = useState(30);
  const [editRounds, setEditRounds] = useState(5);
  const [saving, setSaving] = useState(false);

  const playerCount = Object.keys(players).length;

  useEffect(() => {
    if (room?.phase === 'GUESSING') {
      router.replace(`/game/${roomCode}`);
    }
  }, [room?.phase, roomCode, router]);

  const openEdit = () => {
    if (!room) return;
    setEditPackIds([...room.packIds]);
    setEditDuration(room.roundDuration);
    setEditRounds(room.totalRounds);
    setEditVisible(true);
  };

  const togglePack = (id: string) => {
    setEditPackIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== id);
      }
      return [...prev, id];
    });
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await updateRoomSettings({
        packIds: editPackIds,
        roundDuration: editDuration,
        totalRounds: editRounds,
      });
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
    return <GameLoadingScreen messages={LOADING_MESSAGES.generic} />;
  }

  const selectedPacks = room.packIds.map((id) => getPackById(id)).filter(Boolean);
  const totalQuestions = selectedPacks.reduce((sum, p) => sum + (p?.questions.length ?? 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Lobby</Text>

        {/* Room code card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>ROOM CODE</Text>
          <Text style={styles.code}>{roomCode}</Text>
          <Text style={styles.codeHint}>Share this with friends</Text>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>GAME SETTINGS</Text>
            {isHost && (
              <Pressable onPress={openEdit} style={styles.editBadge}>
                <Text style={styles.editBadgeText}>✏️ Edit</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            style={styles.settingsCard}
            onPress={isHost ? openEdit : undefined}
            disabled={!isHost}
          >
            <View style={styles.settingRow}>
              <Text style={styles.settingIcon}>⏱</Text>
              <Text style={styles.settingValue}>{room.roundDuration} seconds per round</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <Text style={styles.settingIcon}>🔁</Text>
              <Text style={styles.settingValue}>{room.totalRounds} rounds</Text>
            </View>
            <View style={styles.divider} />
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
            {isHost && <Text style={styles.tapHint}>Tap to edit settings</Text>}
          </Pressable>
        </View>

        {/* Players */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PLAYERS ({playerCount})</Text>
          <View style={styles.playerCard}>
            <PlayerList players={players} hostUid={room.hostUid} myUid={myUid} />
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {isHost ? (
          <DuoButton
            label="Start Game"
            onPress={handleStart}
            disabled={playerCount < 2}
            loading={false}
          />
        ) : (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>Waiting for host to start…</Text>
          </View>
        )}
        <Pressable style={styles.leaveButton} onPress={handleLeave}>
          <Text style={styles.leaveButtonText}>Leave Room</Text>
        </Pressable>
      </View>

      {/* Edit modal */}
      <Modal
        visible={editVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditVisible(false)}
      >
        <SafeAreaView style={styles.modal}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Settings</Text>
              <Pressable onPress={() => setEditVisible(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Timer */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>⏱ Time Per Round</Text>
              <View style={styles.chipRow}>
                {TIMER_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[styles.chip, editDuration === opt.value && styles.chipActive]}
                    onPress={() => setEditDuration(opt.value)}
                  >
                    <Text
                      style={[styles.chipText, editDuration === opt.value && styles.chipTextActive]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Rounds */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>🔁 Number of Rounds</Text>
              <View style={styles.chipRow}>
                {ROUNDS_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[styles.chip, editRounds === opt.value && styles.chipActive]}
                    onPress={() => setEditRounds(opt.value)}
                  >
                    <Text
                      style={[styles.chipText, editRounds === opt.value && styles.chipTextActive]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Packs */}
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeaderRow}>
                <Text style={styles.modalSectionTitle}>🃏 Question Packs</Text>
                <Text style={styles.modalSectionMeta}>
                  {PACKS.filter((p) => editPackIds.includes(p.id)).reduce(
                    (s, p) => s + p.questions.length,
                    0,
                  )}{' '}
                  questions
                </Text>
              </View>
              <Text style={styles.modalSectionHint}>Select one or more packs</Text>
              {PACKS.map((pack) => {
                const selected = editPackIds.includes(pack.id);
                return (
                  <Pressable
                    key={pack.id}
                    style={[styles.packCard, selected && styles.packCardSelected]}
                    onPress={() => togglePack(pack.id)}
                  >
                    <Text style={styles.packIcon}>{PACK_ICONS[pack.id] ?? '🎮'}</Text>
                    <View style={styles.packInfo}>
                      <Text style={[styles.packName, selected && styles.packNameSelected]}>
                        {pack.name}
                      </Text>
                      <Text style={styles.packDescription}>{pack.description}</Text>
                      <Text style={styles.packCount}>{pack.questions.length} QUESTIONS</Text>
                    </View>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <DuoButton
              label="Save Settings"
              onPress={saveSettings}
              loading={saving}
              loadingMessages={LOADING_MESSAGES.saveSettings}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingBottom: 8,
  },
  loading: {
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 48,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: 28,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  // Code card
  codeCard: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 20,
  },
  codeLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  code: {
    fontFamily: FontFamily.extraBold,
    fontSize: 48,
    letterSpacing: 12,
    color: Colors.primaryGreen,
    marginVertical: 4,
  },
  codeHint: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textDisabled,
  },
  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  editBadge: {
    backgroundColor: '#EFFFDC',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.badge,
    borderWidth: 2,
    borderColor: Colors.primaryGreen,
  },
  editBadgeText: {
    fontFamily: FontFamily.bold,
    color: Colors.primaryGreen,
    fontSize: 12,
  },
  settingsCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 16,
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
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  packTagsWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  packTag: {
    backgroundColor: '#EFFFDC',
    borderRadius: Radius.badge,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primaryGreen,
  },
  packTagText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Colors.primaryGreen,
  },
  totalQuestions: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textDisabled,
    marginTop: 10,
    textAlign: 'right',
  },
  tapHint: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textDisabled,
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
  playerCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    gap: 8,
  },
  waitingBox: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  waitingText: {
    fontFamily: FontFamily.semiBold,
    color: Colors.textSecondary,
    fontSize: 15,
  },
  leaveButton: {
    alignItems: 'center',
    paddingVertical: 10,
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
    marginBottom: 8,
  },
  // Modal
  modal: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
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
    fontFamily: FontFamily.extraBold,
    fontSize: 22,
    color: Colors.textPrimary,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontFamily: FontFamily.bold,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  modalSection: {
    marginBottom: 28,
  },
  modalSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalSectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  modalSectionMeta: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: Colors.primaryGreen,
  },
  modalSectionHint: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    marginTop: -8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.button,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  chipActive: {
    borderColor: Colors.primaryGreen,
    backgroundColor: '#EFFFDC',
  },
  chipText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primaryGreen,
  },
  packCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    padding: 16,
    marginBottom: 12,
  },
  packCardSelected: {
    borderColor: Colors.primaryGreen,
    backgroundColor: Colors.cardCorrect,
  },
  packIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  packInfo: {
    flex: 1,
  },
  packName: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  packNameSelected: {
    color: Colors.primaryGreen,
  },
  packDescription: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  packCount: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: Colors.textDisabled,
    letterSpacing: 0.5,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkboxSelected: {
    backgroundColor: Colors.primaryGreen,
    borderColor: Colors.primaryGreen,
  },
  checkmark: {
    fontFamily: FontFamily.extraBold,
    color: '#fff',
    fontSize: 15,
  },
});

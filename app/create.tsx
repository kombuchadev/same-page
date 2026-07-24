import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGame } from '@/src/context/GameContext';
import { PACKS, PACK_ICONS } from '@/src/data/packs';
import { DuoButton } from '@/src/components/DuoButton';
import { Colors, Radius, FontFamily } from '@/constants/theme';
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

export default function CreateScreen() {
  const router = useRouter();
  const { nickname } = useLocalSearchParams<{ nickname: string }>();
  const { createRoom, loading } = useGame();

  const [selectedPackIds, setSelectedPackIds] = useState<string[]>(['starter_pack']);
  const [roundDuration, setRoundDuration] = useState(30);
  const [totalRounds, setTotalRounds] = useState(5);

  const togglePack = (id: string) => {
    setSelectedPackIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== id);
      }
      return [...prev, id];
    });
  };

  const handleCreate = async () => {
    if (!nickname) {
      Alert.alert('Error', 'No nickname provided. Please go back.');
      return;
    }
    try {
      const code = await createRoom(nickname, {
        packIds: selectedPackIds,
        roundDuration,
        totalRounds,
      });
      requestAnimationFrame(() => router.replace(`/lobby/${code}`));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const totalQuestions = PACKS.filter((p) => selectedPackIds.includes(p.id)).reduce(
    (sum, p) => sum + p.questions.length,
    0,
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Room Settings</Text>
          <Text style={styles.hostLabel}>Host: {nickname}</Text>
        </View>

        {/* Timer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱ Time Per Round</Text>
          <View style={styles.chipRow}>
            {TIMER_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.chip, roundDuration === opt.value && styles.chipActive]}
                onPress={() => setRoundDuration(opt.value)}
              >
                <Text
                  style={[styles.chipText, roundDuration === opt.value && styles.chipTextActive]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Rounds */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔁 Number of Rounds</Text>
          <View style={styles.chipRow}>
            {ROUNDS_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.chip, totalRounds === opt.value && styles.chipActive]}
                onPress={() => setTotalRounds(opt.value)}
              >
                <Text style={[styles.chipText, totalRounds === opt.value && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Pack multi-select */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>🃏 Question Packs</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalQuestions} questions</Text>
            </View>
          </View>
          <Text style={styles.sectionHint}>Select one or more packs</Text>

          {PACKS.map((pack) => {
            const selected = selectedPackIds.includes(pack.id);
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
          label="Create Room"
          onPress={handleCreate}
          loading={loading}
          loadingMessages={LOADING_MESSAGES.createRoom}
          style={styles.createBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 28,
    marginTop: 8,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontFamily: FontFamily.bold,
    color: Colors.primaryGreen,
    fontSize: 16,
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  hostLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  sectionHint: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    marginTop: -8,
  },
  badge: {
    backgroundColor: Colors.primaryGreen,
    borderRadius: Radius.badge,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    fontSize: 16,
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
    backgroundColor: 'transparent',
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
  createBtn: {
    marginTop: 8,
  },
});

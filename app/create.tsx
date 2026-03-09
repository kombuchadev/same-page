import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGame } from '@/src/context/GameContext';
import { PACKS, PACK_ICONS } from '@/src/data/packs';

const TIMER_OPTIONS = [
  { label: '15 sec', value: 15 },
  { label: '30 sec', value: 30 },
  { label: '45 sec', value: 45 },
  { label: '60 sec', value: 60 },
];

export default function CreateScreen() {
  const router = useRouter();
  const { nickname } = useLocalSearchParams<{ nickname: string }>();
  const { createRoom, loading } = useGame();

  const [selectedPackIds, setSelectedPackIds] = useState<string[]>(['starter_pack']);
  const [roundDuration, setRoundDuration] = useState(30);

  const togglePack = (id: string) => {
    setSelectedPackIds((prev) => {
      if (prev.includes(id)) {
        // Don't deselect if it's the last one
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
      });
      router.replace(`/lobby/${code}`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const totalQuestions = PACKS.filter((p) => selectedPackIds.includes(p.id)).reduce(
    (sum, p) => sum + p.questions.length,
    0
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Room Settings</Text>
        <Text style={styles.hostLabel}>Host: {nickname}</Text>
      </View>

      {/* Timer */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏱  Time Per Round</Text>
        <View style={styles.timerRow}>
          {TIMER_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.timerChip, roundDuration === opt.value && styles.timerChipActive]}
              onPress={() => setRoundDuration(opt.value)}
            >
              <Text style={[styles.timerChipText, roundDuration === opt.value && styles.timerChipTextActive]}>
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
          <Text style={styles.sectionMeta}>{totalQuestions} questions</Text>
        </View>
        <Text style={styles.sectionHint}>Select one or more packs</Text>
        {PACKS.map((pack) => {
          const selected = selectedPackIds.includes(pack.id);
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
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.createButton, loading && styles.createButtonDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.createButtonText}>
          {loading ? 'Creating room...' : 'Create Room'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 28,
    marginTop: 16,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    color: '#2ecc71',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  hostLabel: {
    fontSize: 14,
    color: '#ffffff66',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
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
    fontSize: 16,
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
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkboxActive: {
    backgroundColor: '#2ecc71',
    borderColor: '#2ecc71',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#2ecc71',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ref,
  set,
  update,
  onValue,
  get,
  remove,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database';
import { db, ensureAuth } from '@/firebaseConfig';
import { scoreRound } from '@/src/lib/scoringEngine';
import { pickQuestionFromPacks } from '@/src/data/packs';
import type {
  Room,
  Player,
  GameState,
  GameActions,
  RevealedAnswer,
  RoomSettings,
} from '@/src/types/game';

function generateRoomCode(): string {
  return String(1000 + Math.floor(Math.random() * 9000));
}

export function useFirebaseGame(): GameState & GameActions {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [myAnswer, setMyAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedPlayerIds, setSubmittedPlayerIds] = useState<string[]>([]);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, RevealedAnswer> | null>(
    null,
  );
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const usedPromptIndicesRef = useRef<number[]>([]);
  const unsubscribersRef = useRef<(() => void)[]>([]);

  const isHost = Boolean(room && myUid && room.hostUid === myUid);

  // Auth on mount
  useEffect(() => {
    ensureAuth()
      .then(setMyUid)
      .catch((err) => setError(`Auth failed: ${err.message}`));
  }, []);

  // Subscribe to room data when roomCode changes
  useEffect(() => {
    if (!roomCode || !myUid) return;

    const roomRef = ref(db, `rooms/${roomCode}`);
    const playersRef = ref(db, `rooms/${roomCode}/players`);

    const unsub1 = onValue(roomRef, (snap) => {
      if (!snap.exists()) {
        setRoom(null);
        setError('Room no longer exists');
        return;
      }
      const data = snap.val();
      // Firebase may store arrays as objects with numeric keys — normalize
      const rawPackIds = data.packIds;
      const packIds: string[] = Array.isArray(rawPackIds)
        ? rawPackIds
        : rawPackIds
          ? Object.values(rawPackIds)
          : ['starter_pack'];

      setRoom({
        hostUid: data.hostUid,
        phase: data.phase,
        currentRound: data.currentRound ?? 0,
        totalRounds: data.totalRounds ?? 5,
        timerEndsAt: data.timerEndsAt ?? null,
        currentPrompt: data.currentPrompt ?? null,
        createdAt: data.createdAt ?? 0,
        packIds,
        roundDuration: data.roundDuration ?? 30,
      });
    });

    const unsub2 = onValue(playersRef, (snap) => {
      setPlayers(snap.val() ?? {});
    });

    unsubscribersRef.current = [unsub1, unsub2];

    // Set up presence (onDisconnect)
    const myPresenceRef = ref(db, `rooms/${roomCode}/players/${myUid}/connected`);
    onDisconnect(myPresenceRef).set(false);

    return () => {
      unsubscribersRef.current.forEach((fn) => fn());
      unsubscribersRef.current = [];
    };
  }, [roomCode, myUid]);

  // Subscribe to revealed answers when phase changes to REVEAL
  useEffect(() => {
    if (!roomCode || !room || (room.phase !== 'REVEAL' && room.phase !== 'RESULTS')) {
      if (room?.phase === 'GUESSING') {
        setRevealedAnswers(null);
      }
      return;
    }

    const revealRef = ref(db, `rooms/${roomCode}/revealedAnswers/${room.currentRound}`);
    const unsub = onValue(revealRef, (snap) => {
      setRevealedAnswers(snap.val() ?? null);
    });

    return unsub;
  }, [roomCode, room?.phase, room?.currentRound]);

  // Reset submission state when a new round starts
  useEffect(() => {
    if (room?.phase === 'GUESSING') {
      setHasSubmitted(false);
      setMyAnswer(null);
    }
  }, [room?.phase, room?.currentRound]);

  // Subscribe to public submissions node so all players can see who has submitted
  useEffect(() => {
    if (!roomCode || !room || room.phase !== 'GUESSING') {
      setSubmittedPlayerIds([]);
      return;
    }

    const submissionsRef = ref(db, `rooms/${roomCode}/submissions/${room.currentRound}`);
    const unsub = onValue(submissionsRef, (snap) => {
      setSubmittedPlayerIds(snap.exists() ? Object.keys(snap.val()) : []);
    });

    return unsub;
  }, [roomCode, room?.phase, room?.currentRound]);

  const createRoom = useCallback(
    async (nickname: string, settings: RoomSettings): Promise<string> => {
      if (!myUid) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);

      try {
        let code = generateRoomCode();
        let attempts = 0;

        while (attempts < 10) {
          const snap = await get(ref(db, `rooms/${code}`));
          if (!snap.exists()) break;
          code = generateRoomCode();
          attempts++;
        }

        await set(ref(db, `rooms/${code}`), {
          hostUid: myUid,
          phase: 'LOBBY',
          currentRound: 0,
          totalRounds: settings.totalRounds,
          timerEndsAt: null,
          currentPrompt: null,
          createdAt: serverTimestamp(),
          packIds: settings.packIds,
          roundDuration: settings.roundDuration,
        });

        await set(ref(db, `rooms/${code}/players/${myUid}`), {
          nickname,
          score: 0,
          connected: true,
        });

        usedPromptIndicesRef.current = [];
        setRoomCode(code);
        return code;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [myUid],
  );

  const joinRoom = useCallback(
    async (code: string, nickname: string): Promise<void> => {
      if (!myUid) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);

      try {
        const roomSnap = await get(ref(db, `rooms/${code}`));
        if (!roomSnap.exists()) throw new Error('Room not found');

        const roomData = roomSnap.val();
        if (roomData.phase !== 'LOBBY') throw new Error('Game already in progress');

        await set(ref(db, `rooms/${code}/players/${myUid}`), {
          nickname,
          score: 0,
          connected: true,
        });

        setRoomCode(code);
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [myUid],
  );

  const leaveRoom = useCallback(async (): Promise<void> => {
    if (!roomCode || !myUid) return;

    try {
      await remove(ref(db, `rooms/${roomCode}/players/${myUid}`));

      if (isHost) {
        await remove(ref(db, `rooms/${roomCode}`));
      }

      setRoomCode(null);
      setRoom(null);
      setPlayers({});
      setRevealedAnswers(null);
      setHasSubmitted(false);
      setMyAnswer(null);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [roomCode, myUid, isHost]);

  const updateRoomSettings = useCallback(
    async (settings: RoomSettings): Promise<void> => {
      if (!roomCode || !myUid || !isHost) return;

      await update(ref(db, `rooms/${roomCode}`), {
        packIds: settings.packIds,
        roundDuration: settings.roundDuration,
        totalRounds: settings.totalRounds,
      });
    },
    [roomCode, myUid, isHost],
  );

  const startGame = useCallback(async (): Promise<void> => {
    if (!roomCode || !myUid || !isHost || !room) return;

    const playerCount = Object.keys(players).length;
    if (playerCount < 2) {
      setError('Need at least 2 players to start');
      return;
    }

    const { question, index } = pickQuestionFromPacks(room.packIds, usedPromptIndicesRef.current);
    usedPromptIndicesRef.current.push(index);

    const now = Date.now();
    await update(ref(db, `rooms/${roomCode}`), {
      phase: 'GUESSING',
      currentRound: 1,
      currentPrompt: question,
      timerEndsAt: now + room.roundDuration * 1000,
    });
  }, [roomCode, myUid, isHost, room, players]);

  const submitAnswer = useCallback(
    async (answer: string): Promise<void> => {
      if (!roomCode || !myUid || !room || room.phase !== 'GUESSING') return;
      if (hasSubmitted) return;

      const trimmed = answer.trim();
      if (!trimmed || trimmed.length > 100) {
        setError('Answer must be 1-100 characters');
        return;
      }

      await set(ref(db, `rooms/${roomCode}/answers/${room.currentRound}/${myUid}`), {
        answer: trimmed,
        submittedAt: serverTimestamp(),
      });

      // Write to public submissions node (no answer content — just presence).
      // Fire-and-forget: the answer is already saved, so a race with phase
      // transition should not surface as an error to the player.
      set(ref(db, `rooms/${roomCode}/submissions/${room.currentRound}/${myUid}`), true).catch(
        () => {},
      );

      setMyAnswer(trimmed);
      setHasSubmitted(true);
    },
    [roomCode, myUid, room, hasSubmitted],
  );

  const transitionToReveal = useCallback(async (): Promise<void> => {
    if (!roomCode || !myUid || !isHost || !room) return;

    const answersSnap = await get(ref(db, `rooms/${roomCode}/answers/${room.currentRound}`));
    const answersData = answersSnap.val() ?? {};

    const answerMap: Record<string, string> = {};
    for (const [playerId, data] of Object.entries(answersData)) {
      const answer = (data as any).answer;
      if (answer && answer.trim()) {
        answerMap[playerId] = answer;
      }
    }

    const nonSubmitters = Object.keys(players).filter((id) => !answerMap[id]);
    const { revealed, scoreDeltas } = scoreRound(answerMap);

    for (const playerId of nonSubmitters) {
      revealed[playerId] = {
        answer: '(no answer)',
        normalizedAnswer: '',
        pointsAwarded: 0,
        clusterLabel: '__no_answer__',
      };
      scoreDeltas[playerId] = 0;
    }

    await set(ref(db, `rooms/${roomCode}/revealedAnswers/${room.currentRound}`), revealed);

    const scoreUpdates: Record<string, any> = {};
    for (const [playerId, delta] of Object.entries(scoreDeltas)) {
      const currentScore = players[playerId]?.score ?? 0;
      scoreUpdates[`players/${playerId}/score`] = currentScore + delta;
    }

    scoreUpdates['phase'] = 'REVEAL';
    scoreUpdates['timerEndsAt'] = null;

    await update(ref(db, `rooms/${roomCode}`), scoreUpdates);
  }, [roomCode, myUid, isHost, room, players]);

  const nextRound = useCallback(async (): Promise<void> => {
    if (!roomCode || !myUid || !isHost || !room) return;

    if (room.currentRound >= room.totalRounds) {
      await update(ref(db, `rooms/${roomCode}`), {
        phase: 'RESULTS',
        timerEndsAt: null,
      });
      return;
    }

    const { question, index } = pickQuestionFromPacks(room.packIds, usedPromptIndicesRef.current);
    usedPromptIndicesRef.current.push(index);

    const now = Date.now();
    await update(ref(db, `rooms/${roomCode}`), {
      phase: 'GUESSING',
      currentRound: room.currentRound + 1,
      currentPrompt: question,
      timerEndsAt: now + room.roundDuration * 1000,
    });
  }, [roomCode, myUid, isHost, room]);

  const playAgain = useCallback(async (): Promise<void> => {
    if (!roomCode || !myUid || !isHost) return;

    const scoreResets: Record<string, any> = {};
    for (const playerId of Object.keys(players)) {
      scoreResets[`players/${playerId}/score`] = 0;
    }

    // Clean up game data BEFORE changing phase back to LOBBY,
    // so stale submissions can't trigger auto-transition if the
    // host starts a new game quickly.
    await remove(ref(db, `rooms/${roomCode}/answers`));
    await remove(ref(db, `rooms/${roomCode}/revealedAnswers`));
    await remove(ref(db, `rooms/${roomCode}/submissions`));

    await update(ref(db, `rooms/${roomCode}`), {
      ...scoreResets,
      phase: 'LOBBY',
      currentRound: 0,
      currentPrompt: null,
      timerEndsAt: null,
    });

    usedPromptIndicesRef.current = [];
  }, [roomCode, myUid, isHost, players]);

  return {
    room,
    players,
    myAnswer,
    hasSubmitted,
    submittedPlayerIds,
    revealedAnswers,
    isHost,
    roomCode,
    myUid,
    error,
    loading,
    createRoom,
    joinRoom,
    leaveRoom,
    submitAnswer,
    startGame,
    transitionToReveal,
    nextRound,
    playAgain,
    updateRoomSettings,
  };
}

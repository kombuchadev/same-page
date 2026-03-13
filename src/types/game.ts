export type GamePhase = 'LOBBY' | 'GUESSING' | 'REVEAL' | 'RESULTS';

export interface RoomSettings {
  packIds: string[];
  roundDuration: number; // seconds
  totalRounds: number;
}

export interface Player {
  nickname: string;
  score: number;
  connected: boolean;
}

export interface Room {
  hostUid: string;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  timerEndsAt: number | null;
  currentPrompt: string | null;
  createdAt: number;
  packIds: string[];
  roundDuration: number; // seconds
}

export interface Answer {
  answer: string;
  submittedAt: number;
}

export interface RevealedAnswer {
  answer: string;
  normalizedAnswer: string;
  pointsAwarded: number;
  clusterLabel: string;
}

export interface AnswerCluster {
  label: string;
  playerIds: string[];
  answers: Record<string, string>; // playerId -> original answer
  pointsEach: number;
}

export interface GameState {
  room: Room | null;
  players: Record<string, Player>;
  myAnswer: string | null;
  hasSubmitted: boolean;
  submittedPlayerIds: string[];
  revealedAnswers: Record<string, RevealedAnswer> | null;
  isHost: boolean;
  roomCode: string | null;
  myUid: string | null;
  error: string | null;
  loading: boolean;
}

export interface GameActions {
  createRoom: (nickname: string, settings: RoomSettings) => Promise<string>;
  joinRoom: (roomCode: string, nickname: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  startGame: () => Promise<void>;
  transitionToReveal: () => Promise<void>;
  nextRound: () => Promise<void>;
  playAgain: () => Promise<void>;
  updateRoomSettings: (settings: RoomSettings) => Promise<void>;
}

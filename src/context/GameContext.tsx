import { createContext, useContext, type ReactNode } from 'react';
import { useFirebaseGame } from '@/src/hooks/useFirebaseGame';
import type { GameState, GameActions } from '@/src/types/game';

type GameContextType = GameState & GameActions;

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const game = useFirebaseGame();
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return ctx;
}

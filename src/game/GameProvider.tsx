// Shares one running game with every screen. The provider owns the clock
// (via useGame); screens call `useLoadedGame()` to read state and dispatch.
import { createContext, useContext, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { GameState } from '../economy';
import { colors } from '../ui/theme';
import { useGame } from './useGame';

/** useGame's result once the save has loaded, so `state` is never null. */
export type LoadedGame = ReturnType<typeof useGame> & { state: GameState };

// `createContext<T | null>(null)`: a value React passes down the tree to any
// component that asks for it with useContext, without threading props.
const GameContext = createContext<LoadedGame | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const game = useGame();
  if (!game.state) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  // Screens only mount after loading, so they can rely on `state`.
  return <GameContext.Provider value={game as LoadedGame}>{children}</GameContext.Provider>;
}

export function useLoadedGame(): LoadedGame {
  const game = useContext(GameContext);
  if (!game) throw new Error('useLoadedGame must be used inside <GameProvider>');
  return game;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

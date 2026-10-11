// Saving and loading the game on the device.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { newGame, type GameState } from '../economy';

const SAVE_KEY = 'idle-ring/save';
const SAVE_VERSION = 1;

interface SaveFile {
  version: number;
  /** Wall-clock time of the save (ms), for offline progress. */
  savedAt: number;
  state: GameState;
}

export interface LoadedGame {
  state: GameState;
  /** null for a brand-new game. */
  savedAt: number | null;
}

export async function saveGame(state: GameState): Promise<void> {
  const file: SaveFile = { version: SAVE_VERSION, savedAt: Date.now(), state };
  await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(file));
}

export async function loadGame(): Promise<LoadedGame> {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) return { state: newGame(), savedAt: null };
    const file = JSON.parse(raw) as SaveFile;
    return { state: upgradeSave(file.state), savedAt: file.savedAt };
  } catch {
    // A broken save shouldn't brick the game; start fresh instead.
    return { state: newGame(), savedAt: null };
  }
}

export async function deleteSave(): Promise<void> {
  await AsyncStorage.removeItem(SAVE_KEY);
}

/** Fills in fields added since the save was written, so old saves keep loading. */
function upgradeSave(saved: Partial<GameState>): GameState {
  const fresh = newGame();
  return {
    ...fresh,
    ...saved,
    particles: { ...fresh.particles, ...saved.particles },
    lifetime: { ...fresh.lifetime, ...saved.lifetime },
    levels: { ...fresh.levels, ...saved.levels },
  };
}

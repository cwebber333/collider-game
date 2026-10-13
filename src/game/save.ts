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
  renameParticle(saved, 'jpsi', 'psi'); // renamed 2026-10-11
  // Stabilizers were replaced by Coils (2026-10-11); drop the old level.
  if (saved.levels) delete (saved.levels as Record<string, number>).stabilizers;
  // Long Watch (+offline cap) became Deep Draw (+Charge) on 2026-10-12; keep the levels bought.
  const trialLevels = saved.trials?.levels as Record<string, number> | undefined;
  if (trialLevels && 'longWatch' in trialLevels) {
    trialLevels.deepDraw = Math.min(10, trialLevels.longWatch);
    delete trialLevels.longWatch;
  }
  const fresh = newGame();
  return {
    ...fresh,
    ...saved,
    particles: { ...fresh.particles, ...saved.particles },
    lifetime: { ...fresh.lifetime, ...saved.lifetime },
    levels: { ...fresh.levels, ...saved.levels },
  };
}

/** Moves a renamed particle's balances to its new id (mutates the parsed save). */
function renameParticle(saved: Partial<GameState>, oldId: string, newId: string): void {
  for (const amounts of [saved.particles, saved.lifetime]) {
    // A loosely-typed view, since the old id isn't a ParticleId anymore.
    const loose = amounts as Record<string, number> | undefined;
    if (loose && oldId in loose) {
      loose[newId] = (loose[newId] ?? 0) + loose[oldId];
      delete loose[oldId];
    }
  }
}

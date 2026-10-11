// Colors and spacing. Dark and quiet: an old control room.
import { Platform } from 'react-native';

export const colors = {
  bg: '#0b0e14',
  card: '#131824',
  cardBorder: '#1f2636',
  text: '#d7dce8',
  muted: '#7b8499',
  faint: '#4a5266',
  accent: '#6fd3ff', // beam blue
  good: '#7ee0a1',
  bad: '#ff8a7a',
  warn: '#ffd27a',
  rare: '#d7a6ff',
  buttonText: '#0b0e14',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

/** Fixed-width digits so ticking numbers don't jitter. */
export const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

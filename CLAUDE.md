# Idle Ring

Solo hobby idle/incremental mobile game: a mysterious ancient particle collider. React Native + Expo (TypeScript), **Android first** (the developer is on Windows with an Android phone; iOS later via EAS cloud builds).

@AGENTS.md

## Design docs (read before changing game logic)
- `docs/GDD.md`: game design document (pillars, systems, MVP scope)
- `docs/collider-spec.md`: core loop numbers and formulas for the MVP
- `docs/design-decisions.md`: log of decisions and why
- `docs/research/inspiration-games.md`: Idle Obelisk Miner, Cell: Idle Factory Incremental, Cave Heroes

## Hard design rules
- **No ads, ever.**
- **Nothing drains:** never take something away without something in return (no upkeep, decay, fuel or fail states). Spending currencies on chosen upgrades is fine.
- **No temporary boosts/bursts:** they make normal play feel slow.
- Collider stats (Speed, Power, Detection) **never trade off**; bands are like IOM floors; Speed is beam energy and decides how high a band runs at full output.
- **No progression walls:** time per band grows about 1.5×, never more than 2× from one band to the next.
- Don't reuse names from the inspiration games.

## Code layout
- `src/economy/`: pure TypeScript game logic. **No React/React Native imports.** `state + elapsed time → state`, `state + action → state`.
- `src/data/`: all tunable numbers (bands, particles, upgrades, thresholds). Balance by editing data, not logic.
- `sim/`: headless simulation that runs the economy module with a player bot and reports pacing.
- `src/game/`: React glue: `useGame` (clock, autosave, offline catch-up) and `save.ts` (AsyncStorage).
- `src/ui/` + `App.tsx`: React Native screens that only read state and dispatch actions. Dev-only tools (time skip, reset) show under `__DEV__`.
- Single screen for now; move to Expo Router (`src/app/`) when a second screen is needed.

## Commands
```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest (economy unit tests)
npm run sim         # pacing simulation (player bot)
npx expo lint       # eslint
npx expo start --web  # play in the laptop browser (fastest loop)
npx expo start      # dev server; scan the QR code with Expo Go on Android
```

The developer is comfortable in Python and new to TypeScript. Explain TS-specific idioms briefly when introducing them.

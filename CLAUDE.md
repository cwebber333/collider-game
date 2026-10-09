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
- Collider stats (Speed, Power, Detection) **never trade off**; Speed selects the band (like IOM floors).
- **No progression walls:** time per band grows about 1.5×, never more than 2× from one band to the next.
- Don't reuse names from the inspiration games.

## Code layout
- `src/economy/`: pure TypeScript game logic. **No React/React Native imports.** `state + elapsed time → state`, `state + action → state`.
- `src/data/`: all tunable numbers (bands, particles, upgrades, thresholds). Balance by editing data, not logic.
- `sim/`: headless simulation that runs the economy module with a player bot and reports pacing.
- `App.tsx` and future UI: React Native screens that only read state and dispatch actions.

## Commands
```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest (economy unit tests)
npx expo start      # dev server; scan the QR code with Expo Go on Android
```

The developer is comfortable in Python and new to TypeScript. Explain TS-specific idioms briefly when introducing them.

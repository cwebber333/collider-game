# Design Decisions Log

A running record of decisions made while shaping the game design. Newest at the bottom.

## Foundations (2026-10-08)

| Topic | Decision | Notes |
|---|---|---|
| Project type | Solo hobby project | Trying out game design; no revenue goal |
| Platforms | iOS + Android | |
| Ads | **Never** | Non-negotiable |
| Monetization | None planned | Optional multiplier packs (Obelisk-style) could be considered later, never required |
| Side events | Rotating, but forgiving | Variety from rotation; progress carries over or events return. No permanent loss (the opposite of Cave Heroes' 48-hour pet events) |
| Active vs. idle | Balanced, like Obelisk Miner | Active play clearly speeds things up; idle/offline progress stays solid |
| Upgrade styles | Explore all four | Big mod tree, collectibles that buff, mini-games feeding each other, multiple prestige layers. Still need to check they fit together |
| Theme | Leaning toward **fusion energy** | Must stay clearly different from Antimatter Dimensions |

## Round 2 (2026-10-08)

| Topic | Decision | Notes |
|---|---|---|
| Events | The *events* are the draw, not pets/creatures | Event theme still open |
| Visuals | UI-driven, like CIFI | No need for flashy art; well suited to a solo dev |
| Progression | **Smooth; no hard walls** | IOM's World 4 wall is the example to avoid |
| Session shape | Support both short check-ins and longer sittings | Explore further |
| Theme tone | Fusion as a *loose* theme, **leaning fantastical** | Science as flavor, not a simulation |

## Round 3 (2026-10-08)

| Topic | Decision | Notes |
|---|---|---|
| Progress gate | **Power check**, like IOM | Not a boss fight or puzzle |
| Originality | Don't copy names; copying mechanics is OK | Avoid "Obelisk", "Stargazing", etc. |
| MVP | Accepted: small core first | Expand one system at a time once the core is fun |
| Tone | **More mysterious** | |
| Core mechanic idea | **Particle collider** with upgradable *speed*, *power input*, *detection* | Proposed: collider as core loop, fusion as its power source |

## Round 4 (2026-10-08)

| Topic | Decision | Notes |
|---|---|---|
| Theme | **All-in on the collider**; fusion dropped | Power input now comes from the Wellspring (proposal) |
| Lore | **Open-ended mystery**: more than flavor, never fully resolved | Lets future systems extend the story |
| Title | **Idle Ring** (working title) | Alternative: *The Idle Ring*. A quick search found no existing game with either name |
| Player identity | **C**: faceless operator + notes from previous operators | MVP may start without notes |
| Power source | **Wellspring** confirmed | |

## Round 5 (2026-10-08)

| Topic | Decision | Notes |
|---|---|---|
| Collider stats | **No trade-offs.** Speed, Power and Detection are all simply upgradable | Replaces the v0.2 "bottleneck" design |
| Speed | Works as a **selector**: dial to any reached band, like IOM floors | Each band yields its own particle group |
| Currencies | **Particles per band** | Upgrades cost particles from specific bands, so you switch bands to farm |
| No draining | **Only progression**: never take things away without something in return | Now design pillar 5. Spending currencies on chosen upgrades is fine |
| Crafting | **None for now**: particles are spent directly | A crafting step (like IOM's ore → bars) could be a later system |

## Round 6 — Tech stack (2026-10-08)

| Topic | Decision | Notes |
|---|---|---|
| Stack | **React Native + Expo, TypeScript** | Installable standalone app, not browser-played. Expo's cloud builds (EAS) can build iOS later without a Mac |
| Platform focus | **Android first**, iOS-ready codebase | Developer has Windows + an Android phone, no Mac/iPhone. iOS testing later via someone's iPhone + TestFlight |
| Balance model | **Written in TypeScript as the game's real economy module**, run headless as a simulation | One source of truth for formulas; tunable numbers in data files |

## Round 7 — Collider spec feedback (2026-10-08)

| Topic | Decision | Notes |
|---|---|---|
| Temporary boosts | **None**: overcharge dropped | Burst buffs make base play feel slow when they're off |
| Offline cap | **24 h** | Raisable via progression (schematics node) |
| Wellspring on Recalibrate | **Kept** (default) | Revisit if the simulation shows runs getting too fast |
| Pacing | Spec targets stand as defaults | Validate by feel once the simulation/prototype exists |
| Particle naming | **Real particles first**, then theorized, then invented ("Known → Theorized → Impossible") | Ordered roughly by mass, so higher-energy bands make heavier particles. The Graviton is the turning point at the end of the MVP |
| Threshold / region names | **None**: numbered power checks (T1, T2…), like the Obelisk | Band groups don't need names either |

## Open questions
- How do the four upgrade styles fit into one coherent structure without overload?
- What makes the fusion theme concrete and different from AD's abstract dimensions?
- What is the "progress clock" (Obelisk-level equivalent) that gates unlocks?

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

## Round 8 — Economy module and first balance pass (2026-10-08)

| Topic | Decision | Notes |
|---|---|---|
| Economy code | `src/economy/` (pure TS) + `src/data/` (numbers) + `sim/` (bot + pacing report) | `npm run sim`, `npm test` |
| Cost curves | Each upgrade's cost keeps growing at about the rate income grows (Beam Current ×1.35/level, continuing across particle tiers) | Tier bases that reset cheaper caused runaway Power in the first draft (1e9 at band 12) |
| T1 / T3 Power | **T1 40 → 30**, **T3 250k → 2M** (Resonance reference moved to 2M too) | T3 at 250k was already met on arriving at band 12, so band 12 was skipped |
| Breach rule | Must have **reached the Threshold's band** and have the Power | |
| Rares | **Expected-value trickle**, not random rolls | Deterministic, same online/offline, no bad luck |
| Rare Index levels | Base 1 (1, 5, 25 …) instead of 100 | Rares are ~1/2,000 per collision |

**First sim results** (Watching / Engaged hourly / Idle every 5 h): T1 at 19m / 19m / 5h; T2 at 2h49m / 8h30m / 1d5h; T3 at 18h / 1d15h / 2d15h. Per band, the watched curve mostly runs **1.6–1.8×**, with one 2.75× spot at band 3 caused by the bot's buying order.

**Findings to decide on:**
1. **Spec targets vs. the smoothness rule.** Band 2 at ~2 min plus T1 at 30–45 min means each early band takes ~2.2× the previous one, which breaks "never more than 2×". The current tuning lands T1 at ~20 min instead.
2. **One band per check-in.** Ring Speed for band *n + 1* costs band *n* particles, so you must sit at band *n* to buy the next one. Idle players gain at most one band per check-in, even in run 2 when everything is cheap. Spiral nodes (start at band 4, Band Cycle, Auto-Buy) would ease this.
3. **Run 2 is already fast without Ring Schematics** (19–38% of run 1), because Index levels, Wellspring and breached Thresholds all carry over. Schematics could make run 2 trivial. Revisit Q3 (Wellspring kept) or make schematics nodes modest.

## Round 9 — Answers to the Round 8 findings (2026-10-11)

| Topic | Decision | Notes |
|---|---|---|
| Early pacing | **Exempt bands 1–4 from the 2× rule** | Keeps the spec targets (band 2 at ~2 min, T1 at 30–45 min). The 2× rule applies from band 5 on. Retune once the band-unlock model is settled |
| Band unlocks | **Explore an IOM-style model**: no particle toll to unlock a band; Speed, Power and Detection upgrades limit how well you can farm higher bands | Options written up below; replaces "Ring Speed costs band n particles" if adopted |
| Wellspring on Recalibrate | **Resets** (flips Q3) | Sim: keeping it made run 2 23% of run 1 (watching), resetting it 66%; resetting the Index only moved 23% → 32% |

### Round 9b — Band model (2026-10-11)

| Topic | Decision | Notes |
|---|---|---|
| Band unlocks | **Option B: open dial, Speed = beam energy** | No particle toll to unlock a band. Bands up to the next Threshold are open; Speed sets which run at full output (25% one band too high). Thresholds stay the hard gates, like IOM's Obelisk |
| Band mixes | **Keep the overlap** | Particles span several bands; single-band ores in IOM feel limiting |
| T1 / T3 | T1 **50**, T3 **1.2M** (Resonance reference too) | Puts T1 at ~33 min watched |
| Priority | **Get to a playable build**, tune by playing | |

## Open questions
- How do the four upgrade styles fit into one coherent structure without overload?
- What makes the fusion theme concrete and different from AD's abstract dimensions?
- What is the "progress clock" (Obelisk-level equivalent) that gates unlocks?

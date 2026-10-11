# Threshold Roadmap (draft v0.3)

> The full map of Thresholds across all four Rings, with a rough timeline: what each breach gives, and so where every part of the game unlocks. Companion to [GDD §4–4a](GDD.md). **Everything here is a draft**, especially timings and bonus sizes. The Inner Ring gets built first; the rest shows where future systems will slot in.
>
> **v0.3 changes:** ~60 Thresholds (14 / 14 / 16 / 16 per Ring); an overall timeline; the later Rings deliberately shift focus to the side systems.

## How Thresholds work (recap)

- A **power track** like IOM's Obelisk: Threshold *k* needs Power ≥ its requirement. Breaching is free and can't fail.
- **Every breach gives Crystals**, the premium currency (amount grows with the Threshold number; see [GDD §14](GDD.md)).
- **Every breach gives lore** (a previous operator's note) **plus one reward**:
  - **Unlock**: a system, an upgrade line, or a feature. **Every unlock comes with something to spend on**, so it's usable right away.
  - **Bonus**: a small permanent boost (sizes are placeholders). **Tentative:** the bonus-type rewards may change later.
  - **Milestone**: permits building the connection to the next Ring.
- **Kept through Recalibrate.** After the first Recalibrate, each run pushes past your previous best Threshold.

## Overall timeline (draft)

Rough cumulative play time for an **engaged player** (checks in about hourly while awake). Not set in stone; the sim will check it as systems get built.

| Milestone | Time |
|---|---|
| First Threshold | ~10 min |
| First Recalibrate available | a few hours |
| Connect to the **Second Ring** (T14) | ~4 days |
| Connect to the **Third Ring** (T28) | ~4 weeks |
| Connect to the **Outer Ring** (T44) | **~4–6 months** (target ~5) |
| T60 | ~10 months |

The gap between Thresholds grows smoothly: about ×1.5 per Threshold early, ×1.1–1.15 later, and never more than 2× (outside the opening).

### Later Rings shift the focus (design intent)

In the Third and Outer Rings, Thresholds come **slowly on purpose**: gaps grow from about 3 days to about 2 weeks. That's where the side systems (Detector Array, Stray Signals, Excavation, Anomalies, The Archive, Layer 2) carry most of the progress. You're always progressing, just in a different part of the game, which keeps it fresh. IOM does the same: late Obelisk levels slow down (its progression guide warns that Obelisk progress will "grind to a halt" after about level 61–62) while Stargazing, Fishing and Pets carry progress.

## Bands and rares

- **Bands are never a Threshold reward.** All 12 bands of a Ring are open from the moment you reach it (the Inner Ring from the start). How high you can farm well is decided by Speed (energy) and Power (density), as in IOM where deeper floors are open but slower.
- **Rares work like IOM's veins** (per the [IOM Veins page](https://shminer.miraheze.org/wiki/Veins): each zone's vein is unlocked by a Vein Research paid in that zone's bars plus the previous vein, and veins are spent in several systems):
  - Each Ring has **about 6 rares, one per pair of bands**.
  - You start able to detect the first one. Each next rare is unlocked by **Rare Research**, paid in particles from its bands plus the previous rare.
  - **Sensitivity** raises the chance of every unlocked rare (no more reveal levels).
  - Rares are **kept through Recalibrate** (like veins through prestige).
  - Rares are spent on: Rare Research, **Resonators**, and the **Ring connection** builds.

### Inner Ring rares (draft)

The drift from real to theorized happens inside the rares too.

| Bands | Rare | What it is |
|---|---|---|
| 1–2 | **Positron** | Antimatter electron. Detectable from the start |
| 3–4 | **Antiproton** | Antimatter proton |
| 5–6 | **Tetraquark** | Exotic four-quark particle (observed) |
| 7–8 | **Pentaquark** | Exotic five-quark particle (confirmed 2015) |
| 9–10 | **Glueball** | Made of pure gluons; predicted, never confirmed |
| 11–12 | **Graviton** | Never observed… until the Ring finds it |

## New systems (Inner Ring)

| System | Plays like | Spends | Gives |
|---|---|---|---|
| **Rare Research** | IOM's Vein Research | Band particles + the previous rare | The next rare type |
| **Resonators** | IOM's Statues: permanent upgrade lines | Rares (+ some particles) | Each line buffs a different system: Power, Yield, Wellspring, Index growth, Experiments, offline cap… |
| **Experiments** | IOM's Contracts: a board of requests | A chosen set of particles per request (a trade, never a drain; requests don't expire) | **Data**, a token currency for the Experiments upgrade tree, which boosts several systems |
| **Trials** | IOM's Challenges | Nothing: a separate run with a restriction (e.g. no Collector Grid, Speed capped). Your main run waits safely; quitting a Trial loses nothing | A permanent reward per Trial completed |

## The game's parts at a glance

| Part | First unlocks | Grows at |
|---|---|---|
| Collider (Ring Speed, Beam Current, Collector Grid, Sensitivity) | Start | Throughout |
| Rares + Rare Research | Positron at start, Research at T2 | Each Ring adds ~6 rares |
| Particle Index | T1 | Every new particle |
| Resonators | T3 | T12, T23, T35, T50 |
| Wellspring | T5 | T9 (Capacitors), T20 (mini-game), T39 (second chain) |
| Experiments | T6 | T13, T26, T40, T56 |
| Trials | T8 | T16, T31, T47 |
| Recalibrate and Ring Schematics | T10 | Branches at T11, T24, T42, T54 |
| Ring connections | T14, T28, T44 | — |
| Detector Array (Second Ring station) | T15 | T19, T25, T41, T58 |
| Stray Signals (Stargazing-like; candidate) | T18 | T22, T34, T55 |
| Anomalies (rotating events) | T21 | T33, T49 |
| Excavation (Third Ring station) | T29 | T32, T38, T51 |
| Layer 2 prestige (Orbs-like; see GDD §8) | T37 | T53 |
| The Archive (Outer Ring station) | T45 | T48, T57 |

## Inner Ring: Known particles (bands 1–12)

**At the start:** all 12 bands; Ring Speed, Beam Current, Collector Grid and Sensitivity; the Positron is detectable on bands 1–2.

| T | Reward | Type | Rough time (engaged) |
|---|---|---|---|
| 1 | **Particle Index buffs** switch on | Unlock | ~10 min |
| 2 | **Rare Research**: unlock the Antiproton and onward | Unlock | ~26 min |
| 3 | **Resonators**: the first lines (spend Positrons and Antiprotons) | Unlock | ~1.1 h |
| 4 | +10% Power | Bonus | ~3.0 h |
| 5 | **Wellspring**: Conduits (Power) and Stabilizers (density) | Unlock | ~4.5 h |
| 6 | **Experiments**: the request board and Data upgrades | Unlock | ~6.9 h |
| 7 | Offline cap +4 h | Bonus | ~10 h |
| 8 | **Trials**: the first set | Unlock | ~16 h |
| 9 | **Wellspring: Capacitors**, a third Wellspring line | Unlock | ~24 h |
| 10 | **Recalibrate + Ring Schematics** (Beam and Lens branches) | Unlock | ~1.5 days |
| 11 | **Schematics: Spiral branch** (automation: Band Cycle, Auto-Buy) | Unlock | ~1.9 days |
| 12 | **Resonators: more lines** (Pentaquark, Glueball, Graviton) | Unlock | ~2.4 days |
| 13 | **Experiments: tier 2** requests and upgrades | Unlock | ~3.1 days |
| 14 | **Milestone: connect to the Second Ring** (build with particles + Inner Ring rares + a few Crystals) | Milestone | ~4 days |

## Second Ring: Theorized particles (bands 13–24)

Connecting opens bands 13–24, the Second Ring's first rare, and the **Detector Array** station.

| T | Reward | Type | Rough time (engaged) |
|---|---|---|---|
| 15 | **Detector Array**: first detector modules (boost Yield and rares per particle family) | Unlock | ~4.6 days |
| 16 | **Trials: second set** | Unlock | ~5.3 days |
| 17 | +10% Power | Bonus | ~6.1 days |
| 18 | **Stray Signals**: a signal appears on a rotating band; tune in to catch it; each signal levels a permanent buff | Unlock | ~7.0 days |
| 19 | **Detector Array: second module family** | Unlock | ~8.0 days |
| 20 | **Wellspring becomes a mini-game**: its own resource and production chain (CIFI-style) | Unlock | ~9.2 days |
| 21 | **Anomalies**: the first rotating event | Unlock | ~11 days |
| 22 | **Stray Signals**: auto-catch | Unlock | ~12 days |
| 23 | **Resonators: Second Ring lines** | Unlock | ~14 days |
| 24 | **Schematics: Detector branch** | Unlock | ~16 days |
| 25 | **Detector Array: third module family** | Unlock | ~18 days |
| 26 | **Experiments: tier 3** | Unlock | ~21 days |
| 27 | Offline cap +4 h | Bonus | ~24 days |
| 28 | **Milestone: connect to the Third Ring** | Milestone | ~28 days |

## Third Ring: Fringe particles (bands 25–36)

Connecting opens bands 25–36, the Third Ring's first rare, and the **Excavation** station. From here, Thresholds slow down and the side systems carry more of the progress.

| T | Reward | Type | Rough time (engaged) |
|---|---|---|---|
| 29 | **Excavation**: dig out buried parts of the Ring for relics that boost Speed and Power | Unlock | ~1.0 months |
| 30 | +10% Yield | Bonus | ~1.2 months |
| 31 | **Trials: third set** | Unlock | ~1.3 months |
| 32 | **Excavation: relic sets** (collect a set for a bigger bonus) | Unlock | ~1.4 months |
| 33 | **Anomalies**: second rotation | Unlock | ~1.6 months |
| 34 | **Stray Signals: rare signals** (some signals carry rares) | Unlock | ~1.8 months |
| 35 | **Resonators: Third Ring lines** | Unlock | ~1.9 months |
| 36 | Index levels need 10% fewer particles | Bonus | ~2.2 months |
| 37 | **Layer 2 prestige** (Orbs-like; see GDD §8) | Unlock | ~2.4 months |
| 38 | **Excavation: deeper digs** | Unlock | ~2.7 months |
| 39 | **Wellspring: a second production chain** | Unlock | ~3.0 months |
| 40 | **Experiments: tier 4** | Unlock | ~3.3 months |
| 41 | **Detector Array: module tuning** | Unlock | ~3.7 months |
| 42 | **Schematics: Excavation branch** | Unlock | ~4.1 months |
| 43 | Offline cap +4 h | Bonus | ~4.5 months |
| 44 | **Milestone: connect to the Outer Ring** | Milestone | ~5 months |

## Outer Ring: Impossible / fantasy particles (bands 37–48)

Connecting opens bands 37–48, the Outer Ring's first rare, and **The Archive** station.

| T | Reward | Type | Rough time (engaged) |
|---|---|---|---|
| 45 | **The Archive**: decode messages from beyond the Ring; decoded messages give lore and buffs | Unlock | ~5.2 months |
| 46 | +10% Power | Bonus | ~5.5 months |
| 47 | **Trials: fourth set** | Unlock | ~5.7 months |
| 48 | **The Archive: cipher upgrades** | Unlock | ~5.9 months |
| 49 | **Anomalies**: third rotation | Unlock | ~6.2 months |
| 50 | **Resonators: Outer Ring lines** | Unlock | ~6.5 months |
| 51 | **Excavation: relic forging** (combine relics) | Unlock | ~6.8 months |
| 52 | +10% Resonance | Bonus | ~7.1 months |
| 53 | **Layer 2: second tier** | Unlock | ~7.4 months |
| 54 | **Schematics: Archive branch** | Unlock | ~7.7 months |
| 55 | **Stray Signals: signal chains** (catch signals in sequence for bigger rewards) | Unlock | ~8.1 months |
| 56 | **Experiments: tier 5** | Unlock | ~8.4 months |
| 57 | **The Archive: the operators' last log** | Unlock | ~8.8 months |
| 58 | **Detector Array: final module family** | Unlock | ~9.2 months |
| 59 | All bonuses from bonus Thresholds +50% | Bonus | ~9.6 months |
| 60 | **The last Threshold anyone recorded.** Something answers. (Hook for whatever comes next) | Milestone | ~10 months |

## Notes and open questions

- **Built so far (Inner Ring):** the Threshold track T1–T14 with Crystals, lore and rewards; all bands open from the start; Index buffs (T1), the +Power bonus (T4), Wellspring (T5), the offline-cap bonus (T7) and Recalibrate (T10) work. The other rewards show as "coming soon". T1–T10 requirements are tuned to the timeline; T11–T14 are placeholders until Ring Schematics exist.
- **Still to change:** Sensitivity still reveals rares by level (until the rare research chain is built), and the three new Inner Ring rares (Antiproton, Tetraquark, Glueball) don't exist yet.
- **Not designed yet:** the detailed upgrade lines for Resonators, the Experiments request rules and Data tree, the first set of Trials, and each Ring's rares after the Inner Ring.
- **Trials need a "second save slot"** for the restricted run, so the main run waits untouched. Worth checking how IOM's Challenges handle this on its wiki before designing.
- **Crystals:** every Threshold grants some, like IOM's gems per Obelisk. Spent mainly in a special upgrades shop (like CIFI's), plus small required costs such as part of each Ring connection, always covered by free Crystals. Amounts per Threshold and the shop contents aren't designed yet.
- **Bonus-type rewards are tentative** and may be swapped for other rewards. Bonus sizes (+10% here and there) are placeholders. The sim will set them, along with each Threshold's Power requirement.
- **Working names:** Resonators, Experiments, Trials, Detector Array, Excavation, The Archive and Stray Signals. Stray Signals is still a candidate.
- **Ring twists** (a new rule per Ring, never a penalty) aren't designed yet.
- **Layer 2** placement (T37) is a guess until its design exists.

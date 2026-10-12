# Collider Spec — MVP (v0.1 draft)

> Detailed spec for the core loop described in [GDD §3–4](GDD.md). Covers the first playable version: **bands 1–12, Thresholds 1–3, the first Recalibrate**.
>
> **All numbers are first guesses.** The balance simulation exists to tune them. Structure and formulas matter more than exact values right now.

---

## 1. Rules this spec must follow

- Speed, Power and Detection **never trade off**. Raising any of them is always good.
- **Nothing drains.** Particles only leave through purchases the player chooses. No upkeep, decay or fail states.
- **No walls.** Time per band grows steadily (target ≤1.6× the previous band, **never more than 2×**).
- Older bands stay useful: upgrade costs keep calling for their particles.

---

## 2. Bands

A band is the Ring's version of an IOM floor: a **beam-energy setting** you dial the Ring to. All of a Ring's bands are open (the Inner Ring's from the start); there is no cost to unlock a band. Each band has:

- **Energy needed:** `2^(b − 1)`. Speed (beam energy) at or above it runs the band at **full output** (the band is *stable*). Below it, output falls off: `(energy ÷ needed)²`, so one band too high gives 25% and two bands give about 6%.

- **Density:** how hard collisions are at that band. Higher density means fewer collisions for the same Power.
- **Particle mix:** which particles are produced and in what share.
- **Rare particle (sometimes):** shows up only with enough Sensitivity (§5).

**Density (draft):** `density(b) = 1.8^(b − 1)`, so band 1 = 1, band 5 ≈ 10.5, band 12 ≈ 640.

Particles **overlap across neighboring bands**, like IOM ores spanning several floors. Moving up a band never makes your current currencies disappear, which helps prevent walls.

### Particle naming: Known → Theorized → Fringe → Impossible

The MVP particles are **real physics particles**, roughly **in order of mass**. That matches the physics: heavier particles need higher collision energy, so faster bands produce them. Each outer Ring (GDD §4a) drifts further from reality. The drift from real to unreal is part of the mystery.

| Stage | Ring / bands | Particles |
|---|---|---|
| **Known** | Inner Ring, 1–12 (MVP) | Real particles (below) |
| *Turning point* | 11–12 rare | **Graviton**: theorized, never observed… until the Ring finds it |
| **Theorized** | Second Ring, 13–24 | Predicted but never observed: axion, sterile neutrino, magnetic monopole, dark photon… |
| **Fringe** | Third Ring, 25–36 | Speculative ideas: tachyon, preon, strangelet, Q-ball… |
| **Impossible / fantasy** | Outer Ring, 37–48 | Completely made up, with scientific-sounding names (brainstorm later) |

**Names stay simple:** no slashes or punctuation (see the decisions log).

| Band | Particle mix (%) | Rare |
|---|---|---|
| 1 | Photon 80 · Electron 20 | – |
| 2 | Photon 50 · Electron 40 · Muon 10 | – |
| 3 | Photon 20 · Electron 40 · Muon 40 | Positron |
| 4 | Electron 20 · Muon 50 · Pion 30 | Positron |
| 5 | Muon 30 · Pion 50 · Kaon 20 | – |
| 6 | Pion 30 · Kaon 50 · Tau 20 | – |
| 7 | Kaon 30 · Tau 50 · Psi 20 | Pentaquark |
| 8 | Tau 30 · Psi 50 · B meson 20 | Pentaquark |
| 9 | Psi 30 · B meson 50 · Z boson 20 | – |
| 10 | B meson 30 · Z boson 50 · Higgs 20 | – |
| 11 | Z boson 40 · Higgs 60 | Graviton |
| 12 | Z boson 20 · Higgs 80 | Graviton |

Approximate real masses for flavor text: photon 0 · electron 0.511 MeV · muon 106 MeV · pion 140 MeV · kaon 494 MeV · tau 1.78 GeV · psi (also called J/psi) 3.10 GeV · pentaquark ~4.4 GeV · B meson 5.28 GeV · Z boson 91.2 GeV · Higgs 125 GeV.

All 12 Inner Ring bands are open from the start; Speed and Power decide how well you can farm them. Thresholds are a separate power track (§6).

---

## 3. Production

All multipliers below go through the **stat layer** (`src/economy/statLayer.ts`): bonuses from the same system add up, and systems multiply together (see the [Cross-Link Map](cross-link-map.md)). In game, tap Power or Yield to see the breakdown by system.

```
collisions/sec   = Power ÷ density(selected band) × band efficiency (energy falloff, §2)
particles/sec    = collisions/sec × Yield
each particle    = particles/sec × its share in that band
rare chance/coll = rare base chance × Sensitivity multiplier   (only if Sensitivity ≥ reveal level)
```

- **Base values:** Power 1, Yield 1, so band 1 starts at 1 collision/sec ≈ 0.8 Mote + 0.2 Flicker per second.
- **Offline:** produces at the **same rate as online** for the selected band, for up to **24 h** away. The cap can be raised later through progression (e.g. a schematics node).

---

## 4. Upgrades (MVP set)

Every upgrade is a purchase with particles. **Costs shift to newer particles as the level rises, but keep some older ones**, which is what keeps old bands useful.

| Upgrade | Stat | Effect per level (draft) | Notes |
|---|---|---|---|
| **Beam Current** | Power | ×1.2 Power | The main progression stat |
| **Collector Grid** | Yield | +0.25 Yield (additive) | Cheaper, feels good early |
| **Sensitivity** | Detection | +20% rare chance | Applies to every researched rare |
| **Ring Speed** | Speed | ×2^(1/3) ≈ +26% beam energy | 3 levels make one more band stable. |

**Cost pattern (draft):** `cost(level) = base × growth^level`, paid in the particles listed for that level range:

| Beam Current levels | Paid in |
|---|---|
| 1–8 | Photon |
| 9–16 | Photon + Electron |
| 17–24 | Electron + Muon |
| 25–32 | Muon + Pion |
| 33–40 | Pion + Kaon |
| … | (keeps walking up the particle list, always 2 particles: one older, one newer) |

The other upgrades follow the same idea with different starting particles and growth rates, so different upgrades want different bands at any moment. That's where the "which band do I need?" decision comes from.

**Ring Speed costs:** the 3 levels that stabilize band *n + 1* cost particles from band *n* (the band just below), so you farm your top stable band, or reach up at reduced output, to push further.

---

## 5. Rare particles

Rares work like IOM's veins: one rare per pair of bands, unlocked one at a time by **Rare Research** (from T2), paid in particles from its bands plus some of the previous rare. Data: `src/data/rares.ts`.

| Rare | Bands | Base chance / collision | Research cost (draft) |
|---|---|---|---|
| **Positron** (antimatter electron) | 1–2 | 1 in 2,500 | Known from the start |
| **Antiproton** (antimatter proton) | 3–4 | 1 in 2,000 | 2K electron, 1.5K muon, 25 Positron |
| **Tetraquark** (four quarks, observed) | 5–6 | 1 in 4,000 | 25K pion, 12K kaon, 15 Antiproton |
| **Pentaquark** (five quarks, confirmed 2015) | 7–8 | 1 in 8,000 | 250K tau, 120K psi, 15 Tetraquark, 5K Charge |
| **Glueball** (pure gluons, predicted) | 9–10 | 1 in 15,000 | 3M B meson, 1.5M Z boson, 15 Pentaquark, 60K Charge |
| **Graviton** (theorized, never observed) | 11–12 | 1 in 30,000 | 30M Z boson, 25M Higgs, 15 Glueball, 500K Charge |

- **Sensitivity** raises the chance of every known rare (+20% per level). It no longer reveals rares.
- A band whose rare isn't researched yet shows "a faint signature in the noise".
- Rares accumulate as a steady **expected-value trickle** (fractional amounts; the UI rounds down), not random rolls. Same result online and offline, and no bad-luck streaks.
- **Kept through Recalibrate**: both which rares are known and their balances.
- **Spent on:** Rare Research now; Resonators and Ring connections later (see the [Threshold Roadmap](threshold-roadmap.md)).
- Research should take deliberate farming, especially the rare part (play-test feedback: the first research was affordable the moment T2 opened). Sim, watching / engaged player: Antiproton ~1 h / ~3.75 h, Tetraquark ~1.3 h / ~6.75 h, Pentaquark ~3.7 h / ~8.75 h, Glueball ~10 h / ~1 day, Graviton ~16 h / ~1.2 days.

---|---|---|---|
| **Positron** (antimatter electron) | Bands 3–4 | 1 | 1 in 2,000 |
| **Pentaquark** (real exotic, confirmed 2015) | Bands 7–8 | 5 | 1 in 5,000 |
| **Graviton** (theorized, never observed) | Bands 11–12 | 10 | 1 in 10,000 |

- Before the reveal level, the rare **doesn't appear at all**. The UI can tease it ("faint signature detected…") for mystery.
- Rares accumulate as a steady **expected-value trickle** (fractional amounts; the UI rounds down), not random rolls. Same result online and offline, and no bad-luck streaks.
- For now rares only feed the Particle Index (like veins in IOM: a rich find on certain bands). **How rares get spent is decided later**; no rare-cost upgrades yet.

---

## 5b. Resonators

The main sink for rares (a little like IOM's Statues, which are built in Construct with veins, bars and gems). One upgrade line per rare, each buffing a different system. Data: `src/data/resonators.ts`.

| Resonator | Effect per level | Unlocks |
|---|---|---|
| **Positron** | +5% Yield | T3 |
| **Antiproton** | +4% Power | T3 |
| **Tetraquark** | +30 min offline cap (max 16 levels = +8 h) | T3 |
| **Pentaquark** | +8% Wellspring output | T12 |
| **Glueball** | Index levels need 3% fewer particles (multiplies) | T12 |
| **Graviton** | +5% Resonance | T12 |

- Each also needs its rare researched first.
- Level L costs `10 × 3^L` of the rare plus `base × 3^L` of one particle from its bands (electron, muon, kaon, psi, Z boson, Higgs).
- **Permanent:** kept through Recalibrate, like the rares that pay for them.
- Tuning note: costs grow ×3 per level because rare income grows with Power. At ×1.6 the watching player's Power ran away (T10 in 5.5 h instead of ~20 h). Sim at T10 now: engaged player ~Lv 4–6 on each of the first three; watching player ~Lv 7–11.

## 5c. Experiments

Unlocks at **T6**. A board of requests, like IOM's Contracts (which deliver bars for Contract Points that buy upgrades, and reset on prestige). Data: `src/data/experiments.ts`.

- **Board:** 3 requests. Each asks for 1–2 of your 4 most advanced discovered particles, about **10 minutes of your best production** of each when the request appears, ×1.04 per experiment completed this run.
- **Requests never expire.** **Skip** swaps one for a new request, then has a 10-minute cooldown.
- **Reward:** 10 **Data** per particle type in the request (×Instrument Grants).
- **Cross-links:** once the Wellspring is open, 30% of requests also ask for Charge; 25% of requests also pay about 10 minutes' worth of a rare you know.
- **Data upgrades:** Instrument Grants (+10% Data), Lean Protocols (requests −5%), Rare Assays (+10% rare chance), Charge Studies (+10% Charge), Conduit Studies (+10% Conduit strength), Beam Diagnostics (+5% Power). Each has a max level and costs Data (×1.4–1.5 per level).
- **Resets on Recalibrate:** board, Data, completions and Data upgrades (like IOM's contract upgrades).
- **Tier 2 (T13):** Data upgrade max levels ×2, and +50% Data per experiment.
- Requests are generated with a seeded random number kept in the save, so the economy stays deterministic.
- Sim: the engaged player completes ~15 experiments by T10 and buys a handful of Data upgrades; Threshold pacing is unchanged.

## 5d. Trials

Unlocks at **T8**. Goals with a twist that **complete on their own during normal play**, like IOM's Challenges (which are goals such as "Reach Floor 20 With No Upgrades", paying coins for permanent upgrades, per its wiki). Nothing pauses your run. Data: `src/data/trials.ts`.

- **First set (10 Trials):** e.g. reach 10K Power with no Collector Grid this run; band 8 stable within 2 hours of a run starting; hold 1M Charge; complete 10 Experiments in one run; hold 100 Pentaquarks.
- Each pays **10–20 Marks**. Marks buy permanent **Trial upgrades:** Practised Hands (Beam Current and Ring Speed −4% cost), Long Watch (+1 h offline cap), Quick Hands (Experiment skips 1 min faster), Keen Eye (+10% rare chance), Endurance (+5% Power).
- Completions, Marks and upgrades are **permanent**. More Trial sets come at later Thresholds.

## 5e. Ring connection (T14)

T14 permits building the connection to the Second Ring (like IOM's world monuments): 5B Z bosons, 5B Higgs bosons, some of every Inner Ring rare, and 200 Crystals (players have ~595 free Crystals by then). Building it completes the Inner Ring; the Second Ring itself arrives in a later update. Data: `src/data/rings.ts`.

## 6. Thresholds (power checks)

Thresholds are an **Obelisk-style power track**, separate from the bands. The full list of all ~60, with rewards and timeline, is in the [Threshold Roadmap](threshold-roadmap.md); this section covers the rules.

- **Breaching:** once your **Power** meets the requirement, you tap *Breach*. It costs nothing and can't fail.
- **Every breach gives** Crystals (premium currency), a **lore fragment** (a previous operator's note), and one reward: an unlock, a bonus, or a Ring milestone.
- **Kept through Recalibrate.**
- Requirements are tuned with `npm run tune`, which reads an engaged player's Power at each Threshold's target time.
- The UI shows the next Threshold's reward and a progress bar (current Power ÷ required), plus a list of all Thresholds.

---|---|---|---|
| **T1** | 4 | 50 | Bands 5–8 · Particle Index buffs |
| **T2** | 8 | 3,000 | Bands 9–12 · Wellspring |
| **T3** | 12 | 1,200,000 | Recalibrate (prestige) · Ring Schematics |

- The UI shows a progress bar (current Power ÷ required), so you always know how close you are.
- Each breach reveals a **lore fragment**, usually a previous operator's note.
- Thresholds are **power checks only** (not detection) for now, to keep them easy to read.

---

## 7. Active vs. idle

- **No temporary boosts** (an earlier "overcharge" idea was dropped). Short buffs make the normal speed feel slow whenever they aren't running.
- Active players get ahead through **better-timed decisions**: switching bands when a new upgrade needs different particles, and buying upgrades promptly.
- Automation nodes (Band Cycle, Auto-Buy) let idle players capture most of that benefit over time.

---

## 8. Particle Index (MVP)

- Every particle gets an Index entry the **first time it's collected**: name, description, lore line.
- **Index levels come from *lifetime* totals collected, not current balance**, so spending particles never lowers an Index level (no draining).
- Buffs switch on at **T1**. Level *k* needs `100 × 5^(k−1)` lifetime collected (100, 500, 2,500 …). Rares use a base of 1 instead of 100 (1, 5, 25 …).
- Percent bonuses of the same kind add up (+5% and +5% = +10%). Cost and requirement reductions multiply (−3% twice = ×0.97²), so they can never reach zero.

| Particle | Buff per Index level (draft) |
|---|---|
| Photon | +5% Power |
| Electron | +5% Yield |
| Muon | −3% Ring Speed costs |
| Pion | −3% Beam Current costs |
| Kaon | +5% Power |
| Tau | +5% rare chance |
| Psi | +5% Wellspring output |
| B meson | +5% Yield |
| Z boson | −3% Threshold Power requirements |
| Higgs boson | +5% Resonance from Recalibrate |
| *Positron* (rare) | +3% Yield |
| *Antiproton* (rare) | +5% rare chance |
| *Tetraquark* (rare) | −3% Threshold Power requirements |
| *Pentaquark* (rare) | +5% Power |
| *Glueball* (rare) | +5% Wellspring output |
| *Graviton* (rare) | +5% Resonance |

**Index descriptions** for real particles can mix a real, accessible fun fact with a slightly *off* note from a previous operator (e.g. "The muons down here live longer than they should."). The science stays real, but something is subtly wrong, which foreshadows the turn toward the impossible.

---

## 9. Wellspring

Unlocks at **T5**. The Ring's mysterious power source, with **its own resource: Charge**. It should always feel like its own system; later Thresholds and other systems add new Wellspring mechanics (the full mini-game arrives at T20), especially once base Power stops moving the needle.

- **Charge** gathers on its own once the Wellspring is unlocked: 1 per second, ×Taps, ×(1 + Wellspring output buffs: Psi and Glueball Index, Pentaquark Resonator). It accumulates offline too.

| Upgrade | Effect | Paid in |
|---|---|---|
| **Conduits** | +0.25 **base Power** per level, added before every multiplier (huge at first, fades later) | Charge (100 × 2.2^L) |
| **Taps** | ×1.2 Charge per level | Pion + Kaon, then Tau + Psi |
| **Coils** | Each Conduit gives +15% more base Power per level (so Coils matter more as Conduits pile up) | Kaon + Tau, then Tau + Psi (×3 per level) |
| **Capacitors** (T9) | +2% Power per level for every ×10 of **Charge held**, so holding Charge competes with spending it | Tetraquark + Psi, then Pentaquark + B meson (×3 per level) |

**Resets on Recalibrate**, Charge included. The sim showed that keeping it was the main reason run 2 went fast (23% of run 1 kept vs. 66% reset), leaving no room for Ring Schematics. Permanent Wellspring head starts come from Schematics nodes instead (e.g. start with Conduits at 5).

Coils replaced **Stabilizers** (−4% band density), which applied to every band equally and so was really a hidden "+4% output".

Tuning notes: a first pass (+0.5 base Power per Conduit, cost ×1.6, Taps ×1.3) let the engaged player reach ~×11 Power by T10. Coils at +20% and ×2.2 cost were also too strong (14 levels). Current values: the engaged player has ~13 Conduits and ~6 Coils at T10.

---

## 10. Recalibrate (prestige layer 1)

- Unlocks at **T10**. Available any time after that.
- **Resets:** particles, all upgrades (Wellspring included), Charge, Experiments.
- **Keeps:** breached Thresholds, Particle Index levels, Crystals, rares (known and their balances), Resonators, Ring Schematics.
- **Earns Resonance:** `Resonance = floor(20 × (peak Power this run ÷ 50M)^0.4) × Resonance bonuses`. The first Recalibrate gives about 25.
- **Resonance boosts Power:** every Resonance *ever earned* gives +2% Power (its own "Recalibrate" system in the stat layer). It counts earned, not unspent, so buying Schematics never weakens it, and each run starts clearly stronger than the last.
- The button always **shows the Resonance you'll get** before you confirm. Never a surprise, and always a net gain.

Why the Power boost: without it, a run after Recalibrate only climbed back to the old peak (the first Recalibrate gave ~15 Resonance and run 2 took ~76% as long as run 1). The GDD wants each reset to be "quick to recover from and clearly stronger".

### Ring Schematics

The long-term goal is a **large, branching tree like CIFI's Loop Mods**, not a small skill tree like IOM's. New branches arrive at later Thresholds (see the [Threshold Roadmap](threshold-roadmap.md)). Schematics give **abilities and choices**; Resonators give the steady numbers (GDD §7b). Data: `src/data/schematics.ts`.

| Branch | Opens | Nodes (Resonance cost) |
|---|---|---|
| **Beam** | T10 | Primed Conduits (5): runs start with Conduits 10 · Pressure Valve (4): auto-breach Thresholds · Primed Beam (18): runs start with Beam Current 30 · Overdrive Core (60): ×2 Power |
| **Lens** | T10 | Steady Sensitivity (8): Sensitivity kept through Recalibrate · Neighbour Signals (18): a band's rare also appears on neighbouring bands at half chance · Extra Bench (10): a 4th Experiment request · Annotated Index (60): Index buffs ×1.5 |
| **Spiral** | T11 | Spun Up (8): runs start with band 4 stable · Standing Orders (12): auto Rare Research · Auto-Buy (30): buys Collider upgrades (switchable) · Deep Start (45): runs start with band 7 stable |

The whole tree costs ~250 Resonance; the engaged player has ~110 by T14, so it carries into the Second Ring. Band Cycle (auto-rotate between bands) is planned for a later version.

---

## 11. Pacing targets (what the simulation checks)

The timeline lives in the [Threshold Roadmap](threshold-roadmap.md) (engaged player: checks in about hourly while awake). Key Inner Ring points:

| Milestone | Target time from start |
|---|---|
| First upgrade | < 30 s |
| Band 2 stable | ~2 min |
| T1 | ~10 min |
| T5 (Wellspring) | ~4.5 h |
| T10 (Recalibrate) | ~1.5 days |
| T14 + Second Ring connected (Inner Ring complete) | ~4 days (sim: engaged ~3 days, watching ~13 h, idle ~7.4 days) |

`npm run sim` reports each Threshold's time against its target for watching, engaged and idle players.

**Smoothness rule:** time spent in each band (from stable to the next band stable) grows by about 1.5× per band and **never jumps more than 2×** from one band to the next. **Bands 1–4 are exempt** so the opening can move fast. The simulation flags any band from 5 on that breaks this.

---|---|
| First upgrade | < 30 s |
| Band 2 | ~2 min |
| Band 4 / **T1** | ~30–45 min |
| Band 8 / **T2** | ~6–8 h |
| Band 12 / **T3** → first Recalibrate | ~1–1.5 days |
| Second run back to T3 | ≤ 50% of the first run's time |

**Smoothness rule:** time spent in each band (from stable to the next band stable) grows by about 1.5× per band and **never jumps more than 2×** from one band to the next. **Bands 1–4 are exempt** so the opening can hit both "band 2 at ~2 min" and "T1 at 30–45 min". The simulation flags any band from 5 on that breaks this.

The simulation will also run an **idle player** (checks in every ~4–6 h) to make sure idle stays reasonable.

---

## 12. Implementation notes (for later)

- **All tunable numbers live in data files** (`src/data/`: `bands`, `particles`, `upgrades`, `thresholds`, `constants`), not in code. Tuning means editing numbers, not logic.
- Run `npm run sim` to see pacing. The **Watching** profile (buys the moment it can) shows the economy's own curve; **Engaged** and **Idle** add real check-in gaps and sleep, so their per-band ratios are noisy.
- The economy is a **pure TypeScript module** with no UI: `state + elapsed time → new state`, and `state + purchase → new state`.
- The **simulation** runs that same module headless with a simple "player bot" and outputs pacing charts.
- Offline progress is the same function called with a large elapsed time, so one code path serves both.

---

## 13. Open questions

- [x] **Q1. Offline cap:** **24 h**, raisable through progression.
- [ ] **Q2. Pacing:** targets in §11 are the default until the simulation lets us feel them out. Also open: how many bands per region (currently 4)?
- [x] **Q3. Wellspring on Recalibrate:** **resets** (changed from kept after the sim; see the decisions log, Round 9).
- [x] **Q4. Particle names:** real particles first (Known → Theorized → Impossible).
- [x] **Q5. Region/Threshold names:** none needed. Thresholds are numbered power checks, like the Obelisk.

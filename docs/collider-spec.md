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

A band is the Ring's version of an IOM floor: a **beam-energy setting** you dial the Ring to. Every band up to the next unbreached Threshold is open; there is no cost to unlock a band. Each band has:

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

| Band | Group | Particle mix (%) | Rare |
|---|---|---|---|
| 1 | 1 | Photon 80 · Electron 20 | – |
| 2 | 1 | Photon 50 · Electron 40 · Muon 10 | – |
| 3 | 1 | Photon 20 · Electron 40 · Muon 40 | Positron |
| 4 | 1 | Electron 20 · Muon 50 · Pion 30 | Positron |
| — | **Threshold 1** | | |
| 5 | 2 | Muon 30 · Pion 50 · Kaon 20 | – |
| 6 | 2 | Pion 30 · Kaon 50 · Tau 20 | – |
| 7 | 2 | Kaon 30 · Tau 50 · Psi 20 | Pentaquark |
| 8 | 2 | Tau 30 · Psi 50 · B meson 20 | Pentaquark |
| — | **Threshold 2** | | |
| 9 | 3 | Psi 30 · B meson 50 · Z boson 20 | – |
| 10 | 3 | B meson 30 · Z boson 50 · Higgs 20 | – |
| 11 | 3 | Z boson 40 · Higgs 60 | Graviton |
| 12 | 3 | Z boson 20 · Higgs 80 | Graviton |
| — | **Threshold 3** | | |

Approximate real masses for flavor text: photon 0 · electron 0.511 MeV · muon 106 MeV · pion 140 MeV · kaon 494 MeV · tau 1.78 GeV · psi (also called J/psi) 3.10 GeV · pentaquark ~4.4 GeV · B meson 5.28 GeV · Z boson 91.2 GeV · Higgs 125 GeV.

Thresholds are simply numbered power checks (T1, T2, T3…), with no special names. Bands are grouped only by which Threshold they sit before or after.

---

## 3. Production

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
| **Sensitivity** | Detection | +20% rare chance; reveals rares at levels 1 / 5 / 10 | Positron / Pentaquark / Graviton |
| **Ring Speed** | Speed | ×2^(1/3) ≈ +26% beam energy | 3 levels make one more band stable. Can't go past a Threshold's band until it's breached |

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

| Rare | Appears at | Reveal (Sensitivity lvl) | Base chance / collision |
|---|---|---|---|
| **Positron** (antimatter electron) | Bands 3–4 | 1 | 1 in 2,000 |
| **Pentaquark** (real exotic, confirmed 2015) | Bands 7–8 | 5 | 1 in 5,000 |
| **Graviton** (theorized, never observed) | Bands 11–12 | 10 | 1 in 10,000 |

- Before the reveal level, the rare **doesn't appear at all**. The UI can tease it ("faint signature detected…") for mystery.
- Rares accumulate as a steady **expected-value trickle** (fractional amounts; the UI rounds down), not random rolls. Same result online and offline, and no bad-luck streaks.
- For now rares only feed the Particle Index (like veins in IOM: a rich find on certain bands). **How rares get spent is decided later**; no rare-cost upgrades yet.

---

## 6. Thresholds (power checks)

Speed can't pass a Threshold until it's **breached**. Breaching happens once the Threshold's band is **stable** (enough Speed) and your **Power** meets the requirement. Then you tap *Breach*, which costs nothing and can't fail.

| Threshold | After band | Power required (draft) | Unlocks |
|---|---|---|---|
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
| *Positron* (rare) | +3% all particles |
| *Pentaquark* (rare) | +5% Power |
| *Graviton* (rare) | +5% Resonance |

**Index descriptions** for real particles can mix a real, accessible fun fact with a slightly *off* note from a previous operator (e.g. "The muons down here live longer than they should."). The science stays real, but something is subtly wrong, which foreshadows the turn toward the impossible.

---

## 9. Wellspring (MVP, simplest form)

Unlocks at **T2**. It's a small upgrade panel for now, not yet its own mini-game.

| Upgrade | Effect | Paid in |
|---|---|---|
| **Conduits** | ×1.15 Power multiplier per level | Band 9–12 particles |
| **Stabilizers** | −4% band density per level (makes higher bands easier to farm) | Band 5–8 particles |

**Resets on Recalibrate.** The sim showed that keeping it was the main reason run 2 went fast (23% of run 1 kept vs. 66% reset), leaving no room for Ring Schematics. Permanent Wellspring boosts come from schematics nodes instead (e.g. Wellspring +50%).

---

## 10. Recalibrate (prestige layer 1)

- Unlocks at **T3**. Available any time after that.
- **Resets:** particles, Beam Current, Collector Grid, Sensitivity, Ring Speed, Wellspring.
- **Keeps:** breached Thresholds (no repeated power checks), Particle Index levels, Ring Schematics.
- **Earns Resonance:** `Resonance = floor(10 × (peak Power this run ÷ 1,200,000)^0.4)`, so the first Recalibrate gives about 10.
- The button always **shows the Resonance you'll get** before you confirm. Never a surprise, and always a net gain.

### Ring Schematics (first ~20 nodes of a large tree)

The long-term goal is a **large, branching tree like CIFI's Loop Mods**, not a small skill tree like IOM's. That's why there's no separate skill tree: Schematics is the one big tree, and new branches arrive at later Thresholds (see the [Threshold Roadmap](threshold-roadmap.md)).

Three branches, bought with Resonance:

| Branch | Example nodes |
|---|---|
| **Beam** (Power) | +25% Power · Wellspring +50% · Thresholds −10% requirement |
| **Lens** (Detection/Yield) | +0.5 base Yield · rares +50% · Index levels need −20% |
| **Spiral** (Speed/automation) | Start each run at max band 4 · **Band Cycle** (auto-rotate between 2 chosen bands) · **Auto-Buy** (buys upgrades automatically) · Ring Speed costs −25% · +12 h offline cap |

Unlock-style nodes (Band Cycle, Auto-Buy) are the "CIFI feeling" of new mechanics, not just bigger numbers.

---

## 11. Pacing targets (what the simulation checks)

For an **engaged player** (checks in about once an hour while awake, buys the best available upgrade each time):

| Milestone | Target time from start |
|---|---|
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

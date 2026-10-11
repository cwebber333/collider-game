# The Lost Ring — Game Design Document v0.4 (draft)

> **Status:** rough draft for discussion. Everything here can change.
> Background: [research notes](research/inspiration-games.md) · [decisions log](design-decisions.md)
>
> **v0.4 changes:** the collider stats no longer trade off against each other. **Speed selects a band** (like IOM floors), each band produces its own particles, and particles are the currencies (§3). Thresholds sit between groups of bands (§4).

**Working title:** *The Lost Ring* (formerly *Idle Ring*)

---

## 1. Elevator pitch

Deep underground lies a ring-shaped collider that no one remembers building. You've restarted it. Every collision it records contains particles that shouldn't exist, and every barrier of energy you push past reveals something stranger on the other side.

Particle physics is the *flavor*, not a simulation. The question that drives the player is **what is the Ring, and what lies beyond each Threshold?** The game never fully answers it (see §12).

## 2. Design pillars

1. **Everything feeds everything.** Each system is its own small game whose rewards boost *other* systems.
2. **Always something to do.** Several currencies and upgrade sinks, so every session has something affordable.
3. **Smooth climb, no walls.** When one path slows down, another opens up.
4. **Respect the player's time.** No ads. No penalties for being away. Events come back. Active play speeds you up; idle play never loses ground.
5. **Only progression, never draining.** Never take something away without giving something in return: no upkeep, decay, fuel, consumption over time, or fail states. Spending currencies on upgrades the player chooses is fine; that's a trade, not a punishment. Prestige resets are likewise always a net gain.
6. **Readable, not flashy.** A UI-driven game, like CIFI.
7. **Mystery as motivation.** Lore comes in small pieces. Each milestone answers one question and raises another.

## 3. Core mechanic: the Collider

> Detailed numbers and formulas: **[Collider Spec](collider-spec.md)**.

Three stats, all **purely upgradable**. There are no trade-offs: raising any stat is always good. **Speed is the selector**, the counterpart to IOM's mine floors.

| Stat | What it does | IOM counterpart | Fed by (later) |
|---|---|---|---|
| **Speed** | **Beam energy.** All of a Ring's bands are open; Speed decides how high a band runs at full output. Above that, output falls off sharply. Each band produces its own group of particles | Choosing which floor to mine | Thresholds (§4) |
| **Power** | **Collision rate**: how fast particles are produced. Higher bands are "denser" and need more power to farm efficiently | Pickaxe damage vs. rock HP | Wellspring |
| **Detection** | **Yield** per collision, the chance to catch **rare** particles, and the ability to see faint particles that only appear above a detection level | Loot / luck stats | Detector Array |

### Speed bands = mine floors

- Each **band** produces a specific group of 2–4 particles, like ore types on a floor.
- **Particles are the currencies.** Upgrades cost particles from *specific* bands, e.g. Detection lvl 12 = 400 of particle A (band 2) + 50 of particle F (band 6).
- So you **shift the dial** to farm what you need next. Newer bands have the new particles; older bands stay useful because upgrades keep calling for their particles.
- Later automation (e.g. a band-cycling schedule, unlocked through upgrades or schematics) lets idle players farm several bands without babysitting. This mirrors IOM's later auto-follow features.

### Output (draft formula, to tune in the balance model)
```
Particles/sec at band b = (Power ÷ density(b)) × detection yield × each particle's share in band b
Rare particle chance    = base rarity(b) × detection bonus
```

### Why it works
- **Check-in decision:** "Which band do I need right now?" It's a simple, satisfying choice, not an optimization headache.
- **Always something to buy:** many particle currencies, each with its own upgrade sinks (pillar 2).
- **Natural soft gates:** reaching a new band before you have the power to farm it efficiently just makes it slow, not blocked. Going back to an earlier band is always productive.
- **No temporary boosts:** short buffs make normal play feel slow when they're off. Active players get ahead through well-timed decisions (switching bands, buying promptly); automation helps idle players catch up.

### Resources
- **Particles** (per band) are the main currencies. They also fill the **Particle Index** (§6).
- **No separate generic currency** for now. Add one later only if needed.
- **Particles are spent directly** on upgrades. There's no crafting or refining step for now (a possible later system).

## 4. Progress clock: Thresholds

The Ring is pushing through layered energy barriers called **Thresholds**, the counterpart to IOM's Obelisk levels. Like the Obelisk, they are their **own power track**, not a gate after every few bands.

- **Power check:** Threshold *k* needs Power ≥ its requirement (each roughly 1.6–2.5× the last). Breaching costs nothing and can't fail.
- **Frequent early, slower later:** minutes apart at first, days apart in the Second Ring, and up to about two weeks apart in the last two Rings, where the side systems carry most of the progress. **~60 planned** (IOM's Obelisk goes past 70).
- **Every breach gives something:** a lore fragment (usually a previous operator's note), plus either a **small permanent bonus** (e.g. +2% Power) or an **unlock** (a system, an upgrade line, a feature). Every unlock comes with something to spend on. **Bands are never a Threshold reward**: a Ring's bands are all open once you reach it, and Speed and Power decide how high you can farm well (like IOM floors).
- **Milestone Thresholds permit the next Ring** (§4a), the way IOM's Obelisk levels permit world monuments.
- The full list of Thresholds and rewards is in the [Threshold Roadmap](threshold-roadmap.md).
- **Kept through Recalibrate** (IOM keeps Obelisk progress through prestige too). Each run pushes for Thresholds past your old peak.
- Thresholds are the main pacing tool. The target is a smooth climb (see §9).

## 4a. Rings (the "worlds")

The Ring you start in is the **innermost of several concentric rings**. Each "world" is the next ring outward: a bigger circumference, higher energies, stranger particles. This combines IOM's worlds with CIFI's ships:

- **Like IOM worlds:** each ring brings a new **set of bands** (all open on arrival), a new **particle family**, and its own **rares** (about 6 per ring, unlocked one by one through Rare Research, like IOM's veins). You open a ring by **building the connection** to it, paid in particles plus that ring's rares, once a milestone Threshold permits it.
- **Like CIFI ships:** each ring also **restores a station** of the facility, which brings a whole new system with its own resource that feeds the others.
- **No penalties:** IOM slows the game down in later worlds; we don't. Each ring may have a **twist** (a new rule), never a debuff.
- **Lore:** previous operators' notes can come from the outer rings ("they got further"). How many rings there are stays an open question in-game.

| Ring | Bands | Particles | Rares (veins) | Station / system | Opened at (draft) |
|---|---|---|---|---|---|
| **Inner Ring** | 1–12 | **Known**: real particles | Positron, Pentaquark, Graviton | Collider, Particle Index, Wellspring | Start |
| **Second Ring** | 13–24 | **Theorized**: predicted, never observed (axion, sterile neutrino, magnetic monopole, dark photon…) | TBD | Detector Array | T14 + build |
| **Third Ring** | 25–36 | **Fringe**: speculative ideas at the edge of physics (tachyon, preon, strangelet, Q-ball…) | TBD | Excavation | T28 + build |
| **Outer Ring** | 37–48 | **Impossible / fantasy**: completely made up, but with scientific-sounding names | TBD | The Archive | T44 + build |

About 48 bands across 4 rings, with ~60 Thresholds spread over them (see the [Threshold Roadmap](threshold-roadmap.md)). All numbers are drafts.

## 5. Systems map (candidate list)

Names are placeholders and deliberately not taken from the inspiration games.

| System | Mechanic inspired by | Plays like | Feeds into |
|---|---|---|---|
| **The Collider** (core) | IOM mining floors | Choose a speed band, farm its particles | Everything |
| **The Wellspring** (power source) | CIFI production chains | The Ring draws power from *something* beneath it. Dig conduits deeper and build capacitors. Nobody knows what it's drawing from | Collider **Power** |
| **Detector Array** | IOM upgrade trees | Build and tune detector modules. Each one is better at certain particle families | Collider **detection** |
| **Particle Index** | IOM stars/cards | Collection: each particle gives one specific buff and can be leveled | One specific system per particle |
| **Ring Schematics** (prestige tree) | CIFI mod tree | Big branching tree; some nodes unlock mechanics | Global multipliers + unlocks |
| **Side labs** (later, 1–2) | IOM fishing/archaeology | Small idle games with their own currency, e.g. decoding signals or excavating parts of the Ring | Each boosts a *different* system |
| **Anomalies** (events) | Cave Heroes events | Rotating self-contained modes (§7) | Permanent buffs |
| **Notes** (planned) | IOM Cards | Previous operators' notes found while collecting particles and using systems; upgraded through tiers (§6a) | The particle or system each note is about |

Note how the cross-feeding comes out of the structure: the Wellspring is the power stat, the Detector Array is the detection stat, and the Index buffs specific systems.

## 6. Particle Index

- Particles are grouped by **speed band**. The early ones are vaguely real-sounding; later ones are increasingly impossible and strange.
- Each particle has **one targeted buff** (e.g. "+X% Wellspring output") and **levels up** as you detect more of it.
- Some particles are **rare** and need high detection to spot. Completing the Index gives a clear 100% goal.
- Particle descriptions carry lore. The Index doubles as the place where the mystery unfolds.

## 6a. Notes (planned, not scheduled yet)

A collectible system like **IOM's Cards**, themed as **notes left by previous operators**. Each note gives more knowledge of a particle or system, and that knowledge is the benefit.

How IOM's Cards work (per the [Cards wiki page](https://shminer.miraheze.org/wiki/Cards), checked 2026-10-11): unlocked at Obelisk 15; you get a card by doing what it represents (collecting an ore, firing bombs, catching fish…); each card type gives one perk; tiers make it stronger: **Gilded** (paid with prestige points, gold, gems), **Polychrome** (needs a skill and 10 shards; must be Gilded first), **Infernal** (unlocked per set; 10 shards; scales with your total Infernal cards).

Our version (draft):
- **Found by doing:** collecting a particle, researching a rare, breaching a Threshold, using a system (Wellspring, Experiments…). Each note is about one particle or system.
- **Each note gives one benefit** for its subject (e.g. a Muon note boosts muon gain).
- **Tiers deepen the knowledge** (working names, not IOM's): *Note* → *Annotated* → *Cross-referenced* → *Unredacted*. Higher tiers need extra fragments or currencies and boost the effect more.
- **Lore:** the note text itself is a piece of the mystery; higher tiers reveal more of what the operator wrote.
- **Open questions:** where it unlocks (IOM's is Obelisk 15, so maybe early in the Second Ring); how it relates to the Particle Index (separate system, or the Index's upgrade layer); what the tier currencies are (Crystals could fit one tier).

## 7. Anomalies (rotating events)

Self-contained side modes that rotate, for example one active at a time for about 5–7 days.

- **Forgiving by design:** progress is **saved**. When an anomaly returns, you continue where you left off. Nothing is lost for good.
- **Own rules:** each anomaly is a different mini-game, so it's a break from the main loop.
- **Rewards:** permanent buffs, rare Index entries, lore.
- Example concepts (fits the mysterious tone):
  - **Echo:** the Ring records collisions that haven't happened yet. A prediction/timing mini-game.
  - **Bleed-through:** something leaks in from beyond a Threshold. A burst mode: catch as much as you can before it fades. Every catch counts; nothing is lost.
  - **Signal:** a repeating pattern in the data. A decode puzzle with a small upgrade tree of its own.
  - **Ghost Ring:** a second, mirrored collider appears for a while. A mini-run with simplified rules.

## 8. Prestige layers (draft)

| Layer | Name (placeholder) | Resets | Keeps | Earns |
|---|---|---|---|---|
| 1 | **Recalibrate** | Particles, collider upgrades | Index, schematics (Wellspring resets) | *Resonance* → Ring Schematics |
| 2 | TBD (direction below) | Layer 1 (**not** Thresholds) | Index, Thresholds, anomaly rewards | TBD |
| 3 | TBD | Nearly everything | Meta-progress | Late-game; may never be built |

**Layer 2 direction (not now):** something like CIFI's **Orbs** system, possibly with a version of CIFI's **Meltdown**. Meltdown takes power away, which breaks "nothing drains", so it would need reworking. Check the CIFI wiki before designing it.

Principle: each reset should be **quick to recover from and clearly stronger**. Research found IOM's early prestiges feel weak, which is something to fix.

## 9. Progression philosophy: no walls

Lessons from IOM's World 4 wall:

- **Soft gates, not hard walls.** When the main path slows, a side path (power plant, detectors, Index, anomalies) gives real lateral progress.
- **Target pacing:** time per band grows steadily (about 1.5× per band), **never jumping more than 2×** from one band to the next. Never a sudden 5× wall. Targets are in [Collider Spec §11](collider-spec.md).
- **Model it before building it:** a simulation of the band/particle economy and upgrade costs, so walls show up on paper first.
- **Band overlap:** upgrade costs should mix old and new band particles, so an unfarmable new band never fully blocks progress.
- **Catch-up help:** for example, offline or idle bonuses that scale up when you're behind the expected curve.

## 10. Session design

| Session | Length | What you do |
|---|---|---|
| **Check-in** | 2–5 min | Collect offline particles, spend them, switch to the band you need next |
| **Deep session** | 20–40 min | Plan a schematic path, push a Threshold, play an anomaly, hunt a rare particle at a specific band |

## 11. First playable (MVP) scope

Get the core fun before adding breadth. Once it's enjoyable, flesh out one system at a time.

1. **Collider** with Speed (band selection), Power and Detection: **12 bands**, 10 common + 3 rare particles as currencies
2. **Wellspring** in its simplest form, as the power source (unlocks at T2)
3. **Inner Ring only.** Currently 3 Thresholds (power checks with lore); moving to the frequent Obelisk-style track in §4
4. **Particle Index**: all 13 MVP particles, each with one buff
5. **Recalibrate** (layer 1 prestige) + the first part of Ring Schematics (~20–30 nodes to start; the tree is meant to grow large, like CIFI's mod tree, with branches added at later Thresholds)
6. Offline progress + saving

*Not in MVP:* outer Rings, Detector Array as a separate system (detection is a plain upgrade at first), side labs, anomalies, layers 2–3.

## 12. Lore approach: open-ended mystery

More than flavor text, but **no final answer**. The mystery is structured so it can grow indefinitely as new systems are added.

- **Answer one question, raise another:** each Threshold explains *something* (what a particle family is, what the Wellspring feeds on) and opens a bigger question.
- **Delivered in fragments:** Threshold breaches, Particle Index entries, anomaly rewards, and (optionally) logs from a narrator (§13).
- **No canon ending:** there's always another Threshold. That leaves room for new systems, anomalies and layers to slot into the story later.
- **Write a private "lore bible":** keep a few core truths for consistency without ever revealing them all in-game.

## 13. Player identity (options)

| Option | Description | Pros | Cons |
|---|---|---|---|
| **A. Faceless operator** | Second person, "you." No character | Zero writing/art cost; players project themselves; easiest to extend | Weakest emotional hook; lore has no voice |
| **B. Named operator + journal** | You're a specific person; your own log entries comment on discoveries | A cheap (text-only) voice for lore; personality | Puts words in the player's mouth; needs a consistent voice |
| **C. Operator + a voice in the machine** | Faceless "you," plus a second voice: the Ring's own interface, or notes left by **previous operators** | Great for mystery (the narrator may be unreliable); doubles as the tutorial; previous operators' notes are endless and open-ended | More writing; that voice must stay consistent |
| **D. Crew/team** | You run a team of researchers with traits/roles | Adds a whole system (assignments, traits), like heroes in Cave Heroes | Biggest scope; wants portraits/art; drifts from the core |

**Decision: C**, via *previous operators' notes*. Faceless "you" keeps it cheap, and fragments from earlier operators (who apparently got further… or didn't) suit an open-ended mystery that can always add another note. The MVP may start as plain A and add notes as the lore fills in.

## 14. Monetization

None planned. **No ads, ever.** If optional purchases are ever added, they follow the "optional multiplier pack" idea: never required, and never needed for 100% completion.

### Crystals (premium currency)

- **Earned in play:** every Threshold breach gives Crystals (more for later Thresholds). Other slow free sources may come later.
- **Spent on:**
  - A **special upgrades shop** (like CIFI's diamond specials): permanent upgrades that can't be bought any other way.
  - **Small required costs**, such as part of each Ring connection. **Rule:** any required Crystal cost must always be covered by Crystals the player is guaranteed to have earned for free by that point.
- **Never:** temporary boosts or time skips (design rule), and never needed for 100% completion.
- **Designed so optional purchase is possible later** (Crystal packs), without breaking balance or making buying feel necessary. Nothing is sold now.

## 15. Open questions

- [x] Player identity: **C**, faceless operator + previous operators' notes
- [x] Wellspring as the power source: **confirmed**
- [ ] How deep the Wellspring's own mini-game goes
- [ ] Exact stat formulas and the first balance spreadsheet
- [x] Tech stack: **React Native + Expo (TypeScript)**, Android first. See the decisions log

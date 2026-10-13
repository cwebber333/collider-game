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
| Offline cap | **24 h** | Fixed from the start (changed 2026-10-12, Round 12) |
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
| Rares | **No rare-cost upgrades for now**; rares feed the Index only | Think of them like IOM veins. Decide how they're spent later, when it fits the plan |
| Particle names | **Simple names and symbols, no slashes or punctuation**: J/psi → **Psi (ψ)** (its other real name) | "J/ψ" read like "J or ψ" in cost lists. Applies to future theorized/invented particles too |

## Round 10 — Thresholds and Rings (2026-10-11)

| Topic | Decision | Notes |
|---|---|---|
| Thresholds | **Obelisk-style power track**, ~50 long term, frequent, every breach gives lore + a small permanent bonus or an unlock | Not tied to every few bands anymore; milestones permit the next Ring |
| Thresholds on Recalibrate | **Kept** | Matches IOM (Obelisk progress survives prestige; checked on the IOM wiki) |
| "Worlds" | **Hybrid: concentric Rings.** Each ring = new bands + particle family + rare type (IOM worlds/veins) and restores a station with a new system (CIFI ships). Opened by building the connection after a milestone Threshold | No IOM-style speed debuffs; a ring may have a twist instead |
| Particle stages | Known → Theorized → **Fringe** → **Impossible / fantasy** | Outer Ring particles are made up but lean on scientific-sounding names |
| Research notes | Fixed: IOM prestige does **not** reset the Obelisk | Check the reference game's wiki before relying on how it works |
| Title | **The Lost Ring** (working title, replaces *Idle Ring*) | Fits the mystery. The name is already used by a 2008 McDonald's/Olympics alternate reality game and a small 2023 itch.io RPG; neither is an idle game. Recheck before any store release. Internal ids (package name, app slug, save key) stay `idle-ring` so saves and links keep working |

### Round 10b — Roadmap review (2026-10-11)

| Topic | Decision | Notes |
|---|---|---|
| Bands | **All of a Ring's bands open on arrival**; never a Threshold reward | Speed and Power already gate how high you can farm, like IOM floors |
| Unlocks | **Every unlock must come with something to spend on** | Nothing that unlocks and then sits unused |
| Rares | **Rare research chain, like IOM veins**: ~6 rares per Ring (one per 2 bands), start with Positron, unlock each next rare with Rare Research (band particles + previous rare). Kept through Recalibrate | Inner Ring: Positron, Antiproton, Tetraquark, Pentaquark, Glueball, Graviton. Sensitivity only raises chance now |
| Wellspring | **Its own resource, Charge** (gathers over time, offline too). **Conduits** cost Charge and add **base Power** (added before multipliers: big early, fades later). New **Taps** upgrade raises the Charge rate. Later systems add new Wellspring mechanics | It was just a second Beam Current; it should feel like its own mysterious system from T5 on |
| Stabilizers → Coils | **Coils** (paid in particles) make every Conduit give more base Power; Stabilizers (−4% density) removed | Stabilizers never changed which band was best, so they were a hidden +4% output. Coils keep the Wellspring self-contained and add a choice: more Conduits (Charge) or stronger ones (particles) |
| Experiments (built) | 3-request board; requests sized to ~10 min of your best production; never expire; skip with a 10 min cooldown; Data upgrades reset on Recalibrate | Modelled on IOM's Contracts (checked on its wiki) |
| Stat composition | **Additive within a system, multiplicative across systems**, enforced by one stat layer; exceptions labelled per contribution (Beam Current and Taps compound, reductions multiply, time adds) | From IOM (per the user's IOM reference notes). Fixed Charge, which summed Index and Resonator bonuses |
| Cross-links (Inner Ring) | **Built:** later Rare Research costs Charge; 30% of Experiment requests ask for Charge; Conduit Studies Data upgrade; 25% of requests also pay a rare. **Skipped/later:** Resonators→Experiments, Index Conduit buff, Coils→rare chance | Chosen for changing what the player does, not just nudging numbers. See docs/cross-link-map.md |
| Ring Schematics (built) | 12 nodes in Beam / Lens / Spiral (Spiral at T11): head starts, automation, kept levels, neighbour rares, an extra Experiment slot, two big multipliers. ~250 Resonance total | Follows "abilities and choices"; cheap first node per branch so the first Recalibrate buys something right away |
| Resonance boosts Power | **+2% Power per Resonance ever earned** (its own "Recalibrate" system); Resonance scale 10 → 20 | Without it, runs after Recalibrate only regained the old peak. Counts earned, not unspent, so spending never weakens it |
| Bot Recalibrate policy | Recalibrate when the gain would at least double Resonance earned, and not within 30 min of the last | A common prestige rule of thumb; used by the sim and tuner |
| Trials (built) | **Goals completed during normal play**, not separate restricted runs; pay Marks for permanent Trial upgrades | IOM's Challenges work this way (checked on its wiki); no second save slot needed |
| Capacitors (built) | **Stored Charge → Power** (+2%/level per ×10 Charge held), paid in a rare | Gives Charge a reason to be held, against spending it on Conduits, Research and Experiments |
| Higher Data upgrade caps (built; was "Experiments tier 2") | Data upgrade caps ×2, +50% Data | Small; more Experiment depth comes in later Rings |
| Ring connection (built) | T14 build: 20B Z + 20B Higgs (×4 on 2026-10-12), some of every Inner Ring rare, 200 Crystals | Completes the Inner Ring. First real use of Crystals |
| Resonators vs. Schematics | **Resonators give numbers; Schematics give abilities and choices** | Both are permanent. Schematics avoid small +X% nodes that duplicate Resonators; at most a few big multipliers. See GDD §7b |
| Schematics size | **Ring Schematics grows into a large CIFI-style tree** (like Loop Mods) | Why no separate IOM-style skill tree: one big tree instead of two small ones |
| Overall timeline | **Outer Ring reachable in ~4–6 months** (engaged player); Second Ring ~4 days, Third ~4 weeks, T60 ~10 months | Not set in stone |
| Premium currency | **Crystals.** Every Threshold grants some (like IOM's gems per Obelisk) | Briefly called Diamonds; switched to Crystals, which also avoids CIFI's name (its premium currency is Diamonds) |
| Crystal uses | **Special upgrades shop** (like CIFI's diamond specials), plus **small required costs** (e.g. part of each Ring connection) | Any required Crystal cost must be covered by Crystals earned free by that point |
| Buying Crystals | **Design for optional purchase later** (packs); nothing sold now | Never required, never needed for 100%, no ads, no temporary boosts or time skips |
| Notes (idea) | **Plan a Cards-like system called Notes**: previous operators' notes about particles and systems, collected by doing and upgraded through tiers | Not scheduled yet; see GDD §6a. Tier names will be our own, not IOM's |
| Bonus-type Threshold rewards | **Tentative** | May be swapped for other rewards later |
| Recalibrate + Schematics | **Stay at T10** (~1.5 days) | Considered moving them to ~T4 (~3 h); with the whole Inner Ring taking ~4 days, a day-and-a-half first run is fine |
| Threshold count | **~60** (14 / 14 / 16 / 16 per Ring) | Third and Outer Rings get a couple more, not ~20 |
| Later Rings | **Thresholds slow down on purpose** (gaps ~3 days → ~2 weeks); side systems carry progress there | Like IOM, where late Obelisk levels slow and Stargazing, Fishing, Pets etc. carry progress. Keeps it fresh |
| New early systems | **Resonators** (rare sink, statue-like), **Experiments** (request board → Data tree, contract-like), **Trials** (challenge-like restricted runs) | Clearance skill tree not chosen; Schematics is the big tree. Placement in the [Threshold Roadmap](threshold-roadmap.md) v0.2 |

## Round 11: Mobile UI layout (2026-10-12)

| Topic | Decision | Why |
|---|---|---|
| Layout | **Hybrid (option C):** a collider strip always on top (Power, Yield, band picker, next-Threshold bar with Breach), the current tab below, five bottom tabs: Collider, Wellspring, Stations, Recalibrate, Menu | The player always sees how the Ring runs and how close the next Threshold is. Chosen over a pure IOM layout (collider fills the screen, menus as sheets) and a pure CIFI layout (fixed tabs only) |
| Stations | A CIFI-console-style **hub of tiles** (Rare Research, Resonators, Experiments, Trials), each opening its own page | CIFI's Upgrade Console lists areas that unlock with ship progress; the hub grows without the tab bar growing |
| Menu | An IOM-style **grid of every system**, grouped Permanent / This run / Other | IOM's menu groups systems by whether prestige resets them. The user likes being able to reach anything in one or two taps |
| Locked things | Tabs and tiles stay visible, dimmed, showing "Unlocks at T#" | You can see what's coming |
| Badges | A dot on a tab or tile when something there can be bought or done | Tells you where to look without opening everything |
| Pop-ups | Away report, Threshold breach (reward, where to find it, lore), Power/Yield breakdown | Big moments get a beat of their own |
| Laptop play | In the browser the game is held to phone width (430 px) | Play tests on the laptop look like the phone |
| Later | IOM-style pinning of favourite menus to the bar, if the tab choices feel wrong in play | |

## Round 12: Play-test changes (2026-10-12)

| Topic | Decision | Why |
|---|---|---|
| Offline cap | **Fixed at 24 h from the start.** Its three upgrades became other things: T7 → **+10% Yield**; Tetraquark Resonator → **+8% Data from Experiments**; Trial upgrade Long Watch → **Deep Draw (+10% Charge)**. Later Roadmap rows T27 and T43 → +10% Power and +10% Yield | Starting lower and raising it to 24 h isn't much of a reward; a full day from day one is friendlier |
| Trials | **Progress counts from when Trials open.** Experiments and Collect Trials count only what happens after that; anything already true then needs a later run (after a Recalibrate). The two "hold a rare" Trials became "collect" Trials. The card shows progress bars | Busy Bench and Exotic Collection were completing the moment Trials unlocked |
| "Experiments: tier 2" | Renamed **Higher Data upgrade caps** (×2 caps, +50% Data) | Says what it does |
| Wellspring Charge | **No cap** | A cap throws away production while you're away. Capacitors reward holding Charge, so a cap would cap them too. Charge grows steadily, and Capacitors only count factors of 10, so there's no runaway |
| Gravity Well | Planned (GDD §6b), like IOM's Void Drone portals | Farm a high band and still get every lower band's particles |
| Ring 2 connection | Cost ×4 (20B Z + 20B Higgs, ×4 rares): about **10 h** more after T14 for an engaged player | Should be a small grind, not instant |
| Operator's notes | Rewritten: the Ring is a machine (not sentient), and each note only covers what was just found | The old notes hinted at a living Ring and ran ahead of the player |

## Round 13: Second Ring systems (2026-10-13)

| Topic | Decision | Why |
|---|---|---|
| Approach | **Design the Second Ring's systems on paper first** ([ring-2-systems.md](ring-2-systems.md)) | They're the big, minigame-like ones |
| Order | **Stray Signals at T15, Detector Array at T18** (swapped) | IOM opens Stargazing before Fishing. Signals builds on choosing bands, is lighter to learn, and rewards active play at the start of a Ring |
| Stray Signals | **Tap-to-catch with a low spawn rate at first**; auto-catch comes later | Rewards active play early |
| Wellspring chain (T20) | **A CIFI-style cascade:** Springs make Charge, and each higher tier makes the tier below. Nothing is consumed | CIFI's core loop, checked on its wiki. Tried "for now": blending it into an IOM-style game is unproven |
| Early pacing | **Leave as is** | Idle players are already 5–9× slower early |
| Names | **Short and easy to say**, made up if needed (the Inner Ring too, later) | "Sterile neutrino" and similar are clunky |

## Open questions
- How do the four upgrade styles fit into one coherent structure without overload?
- What makes the fusion theme concrete and different from AD's abstract dimensions?
- What is the "progress clock" (Obelisk-level equivalent) that gates unlocks?

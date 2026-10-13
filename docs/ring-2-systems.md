# Second Ring systems: design draft (v0.1, 2026-10-13)

Status: **draft for review**. Nothing here is built. These three are the Second Ring's big systems, each meant to feel like its own small game (like IOM's Fishing, Stargazing and Archaeology). Each one adds something to collect or tweak at every check-in. Names follow the short-and-simple rule; particle names are still to be chosen.

The IOM mechanics described below were checked on the IOM wiki (Fishing, Stargazing and Archaeology pages) on 2026-10-13.

---

## 1. Stray Signals (T15): catch things on a moving band, like IOM's Stargazing

**What IOM's Stargazing does:**
- Each Star is "sighted" on a floor, and the floors rotate every 30 minutes on the wall clock.
- Clearing that floor has a 1/50 chance to spawn the Star. You tap it as it crosses the screen; auto-catch upgrades do that for you.
- Each Star has its own perk and levels up from Stars caught. Level caps are raised by other systems.
- Being on the right floor when offline counts (there's a later upgrade for it).

**Our version:**
- Each **signal** (around 8 in the Second Ring, more later) is heard on a band, and those bands rotate every 30 minutes on the wall clock.
- Running that band gives each collision-second a small chance to **pick up** the signal. Early on a signal appears on screen and you tap to catch it. Auto-catch upgrades take over gradually (no timers or boosts).
- Each signal type **levels up** from catches, and each one buffs one thing (e.g. "Hum: +3% Power per level").
- Level caps are raised by the Detector Array, Trials and Schematics. That's the cross-link that keeps it growing.
- **What you do at a check-in:** see which band a signal is on, maybe switch bands to chase one you want, level signals up.
- **Offline:** if you log out on a signal's band, you keep catching it (auto-catch rate).

### Detail (decided 2026-10-13)
- **Rotation: by the real clock,** at xx:00 and xx:30 on the device clock, like IOM, so players can learn the schedule.
  - The economy needs the wall-clock time passed in. Store it in the state and advance it alongside `elapsed`.
  - During offline catch-up, rotations are worked through window by window.
  - The sim sets a starting clock time.
- **Bands: all of 1–24.** Inner Ring bands stay worth visiting.
- **Spawning:**
  - While you run a signal's band, each second has a small chance to spawn it: at first about one spawn per 10 minutes on that band.
  - The randomness comes from the seeded generator in the save, like Experiment requests.
- **Catching:**
  - A spawned signal shows as a tappable "📡 Signal" button on the collider strip for **30 seconds**. Missing one only costs that catch.
  - **Auto-catch** upgrades give a % chance that a spawn is caught by itself. That's also how signals are caught offline, when you log out on a signal's band.
- **Levels:**
  - Each signal levels up from catches and buffs one thing.
  - Level caps start low. The Detector Array, Trials and Schematics raise them (the cross-links).
- **Still open:** how many signals there are (about 8?), their names (short and simple) and which buff each gives, the auto-catch upgrade path, and level costs.

## 2. Detector Array (T18): runs in the background, like IOM's Fishing

**What IOM's Fishing does:**
- Each dock gets a tick when a 60 s bar fills, and a dock's meter needs N ticks.
- When the meter is full, each fish rolls a catch chance: dock power ÷ fish power, with anything over 100% giving extra rolls.
- You assign drones to docks. Fish fill notices that pay tokens, and tokens buy upgrades for other systems.
- Ticks build up offline exactly as they do online.

**Our version:**
- The Array has **sectors** (Lake/Desert-style tiers), opened one by one. Each sector watches one part of the Second Ring's bands.
- You build **detectors** and assign them to sectors. A sector's **sensitivity** is the sum of its detectors' strength.
- Every tick (60 s base) each sector's meter fills. When it's full, each **trace** type in that sector rolls: catch chance = sensitivity ÷ the trace's strength. Over 100% means extra traces.
- **Traces** are the Array's resource, one kind per sector. They're spent on:
  - **Detector upgrades:** strength, tick speed, more slots.
  - **Lenses:** permanent buffs to other systems (Yield, rare chance, Data, Charge).
- Offline: ticks build up and resolve on return, same as online.
- **What you do at a check-in:** collect traces, buy and move detectors toward the sector you're pushing, buy a lens.
- **Cross-links:**
  - Feeds rare chance, Yield, the Index and Experiments.
  - Is fed by Ring Speed or Power (detector strength scales a little with Power), Resonators (a Second Ring rare line) and Schematics (a Detector branch at T24).

## 3. Wellspring chain (T20): CIFI-style production

**What CIFI does** (Generators page on its wiki, checked 2026-10-13):
- **MK1 generators make Cells every tick, and each higher MK makes generators of the tier below:** MK2 makes MK1s, MK3 makes MK2s, and so on up to MK8.
- **Higher tiers unlock at huge Cell totals** (MK4 at 4 QU, MK5 at 5e46 … MK8 at 8e1050). From MK4 up, each also needs a Loop Mod from the prestige tree.
- **Hand-bought generators count separately from produced ones,** and "can be used as a base for several important multipliers".
- **Purchases can be automated later** (Automation Hub).

**Option D, a cascade** (chosen 2026-10-13):
- Tier 1 **Springs** make Charge, tier 2 makes Springs, tier 3 makes tier 2, and so on. Nothing is consumed.
- Higher tiers unlock through Thresholds and Schematics nodes, like CIFI's Loop Mods.
- Hand-bought producers earn their own multiplier, which rewards active play.
- It resets with the Wellspring on Recalibrate, so every run rebuilds the chain.
- Growth builds on itself, adding a power of time per tier, so Conduits and Charge's links into Power need re-tuning. The bot and sim have to learn which tier to buy.

The option C below (refiners and Flux) is the alternative: it gives Charge a new use, where the cascade gives it a new way to grow.

**Our version:**
- Charge stops being the end of the line. **Refiners** turn Charge into a second resource (working name **Flux**). Later stages turn Flux into a third.
- Each stage is a small chain of producers you buy and upgrade. Each stage feeds Power or the Collider in its own way.
- Refiners **don't consume** your Charge balance; they have their own input rate. So nothing drains, and holding Charge for Capacitors still works.
- **What you do at a check-in:** buy producers, decide which stage to push.

## 4. Anomalies (T21), outline only

Rotating events with their own short mode, paying permanent buffs (GDD §7). They'll get their own design pass.

---

## Decisions and open questions (2026-10-13)

1. **Order:** IOM opens Stargazing (Obelisk 23) before Archaeology (30) and Fishing (37). **Decided: swap, so Stray Signals comes at T15 and the Detector Array at T18.** Signals builds on choosing bands, which players already do. It's lighter to learn, gives the 12 new bands a reason to move around, and rewards active play at the start of a Ring.
2. **Stray Signals:** **tap-to-catch with a low spawn rate at first** (decided). Auto-catch comes later through upgrades.
3. **Wellspring chain:** three options.
   - A: refiners leave Charge alone.
   - B: refiners convert Charge.
   - C: the player sets what share of *new* Charge feeds the refiners; the stored balance is never touched.
   - D: a CIFI-style cascade where each tier produces the tier below (see §3).
   **Decided: D, the cascade,** "for now". The user isn't sure how well a CIFI element blends into an IOM-style game, so check the feel in play. C is kept for later if Charge needs new uses.
4. **Ring 2 particle names:** I propose them with the foundation work, short and easy to say.

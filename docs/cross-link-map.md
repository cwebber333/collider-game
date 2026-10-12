# Cross-Link Map (v0.2)

> Which systems feed which. The goal (GDD pillar 1, "everything feeds everything") is that no system is self-contained: each one draws on others and feeds others, so when one stalls, the rest keep it moving. Companion to the [GDD](GDD.md) and [Threshold Roadmap](threshold-roadmap.md).
>
> ✅ = built · ○ = proposed (for later) · * = system not built yet
>
> **v0.2:** the stat layer (`src/economy/statLayer.ts`) now enforces the composition rule for Power, Yield, Charge, Conduit strength, rare chance and Resonance, and the game shows each stat's breakdown (tap Power or Yield). Links #1, #2, #3 and #7 from §4 are built.

## 1. Rules

1. **Stat composition: additive within a system, multiplicative across systems.** Every bonus belongs to a source system. Bonuses from the same system add up; each system's total then multiplies with the others. Example: Power = base × (Collider) × (1 + all Index Power buffs) × (1 + all Resonator Power) × (1 + all Data Power) × …
   *Borrowed from IOM, whose stats page says "different menu effects are multiplicative" (per the user's IOM research notes, §20.1).*
2. **Exceptions are per contribution, and labelled.** Current ones:
   - Beam Current compounds within itself (×1.2 per level). It's the core engine.
   - Reductions (costs, requirements) multiply within a system (×0.97 per level), so they can never reach zero.
   - Time adds across systems (offline cap hours).
3. **Every headline stat draws on several systems** (Power, Yield, Charge, rare chance: aim for 4+).
4. **Every system feeds at least two others and draws on at least one other system's output.**
5. **Resonators give numbers; Ring Schematics give abilities and choices** (GDD §7b).
6. **No duplicates inside a system:** two lines in the same system shouldn't boost the same stat the same way.

## 2. Stats: who contributes

Rows are stats; columns are systems.

| Stat | Collider | Wellspring | Index | Thresholds | Resonators | Experiments | Schematics* | Notes* | Crystal shop* |
|---|---|---|---|---|---|---|---|---|---|
| **Power** | ✅ Beam Current | ✅ Conduits (base) | ✅ Photon, Kaon, Pentaquark | ✅ T4 | ✅ Antiproton | ✅ Diagnostics | ○ one big node | ○ | ○ |
| **Yield** | ✅ Collector Grid | | ✅ Electron, B meson, Positron | | ✅ Positron | ○ | | ○ | ○ |
| **Charge rate** | | ✅ Taps | ✅ Psi, Glueball | | ✅ Pentaquark | ✅ Charge Studies | ○ | ○ | |
| **Conduit strength** | | ✅ Coils | ○ | | | ✅ Conduit Studies | ○ head start | ○ | |
| **Rare chance** | ✅ Sensitivity | ○ | ✅ Tau, Antiproton | | | ✅ Rare Assays | ○ ability | ○ | |
| **Index requirement** | | | | | ✅ Glueball | ○ | | ○ | |
| **Offline cap** | | | | ✅ T7 | ✅ Tetraquark | | ○ | | ○ |
| **Costs** (Beam, Ring Speed) | | | ✅ Pion, Muon | | | ○ | | | |
| **Threshold requirement** | | | ✅ Z boson, Tetraquark | | | | | | |
| **Resonance gain** | | | ✅ Higgs, Graviton | | ✅ Graviton | | | | |
| **Data gain / request size** | | | | | ○ | ✅ Grants, Protocols | | ○ | |

**Gaps this shows:**
- **Conduit strength** has one source (Coils). It's the Wellspring's headline stat, so it should have more.
- **Rare chance** has no Wellspring link, and **Index requirement** has only one source.
- **Experiments** are fed by nothing outside themselves (only their own Data upgrades boost them).
- **Thresholds** give only 2 small bonuses (tentative anyway).

## 3. Resources: who makes them, who spends them

| Resource | Made by | Spent on (✅ built) | Proposed extra sinks (○) |
|---|---|---|---|
| Particles | Collider (bands) | Every upgrade, Rare Research, Resonators, Experiments | — |
| Rares | Collider (band pairs, Sensitivity), ✅ Experiments (some requests pay one) | Rare Research, Resonators | ○ Ring connection builds (planned), ○ Notes tiers |
| **Charge** | Wellspring | Conduits, ✅ Rare Research (Pentaquark on), ✅ some Experiment requests | — |
| Data | Experiments | Data upgrades | ○ Notes tiers |
| Crystals | Thresholds | *(nothing yet)* | ○ Crystal shop, ○ Ring connections |
| Resonance | Recalibrate | *(Schematics not built)* | ○ Schematics |

**Gaps:**
- **Charge** only buys Conduits, so the Wellspring is a closed loop (particles → Taps → Charge → Conduits → Power).
- **Data** only buys Data upgrades: another closed loop.

## 4. Proposed new links (for review)

Each is small and targeted at a gap above. Accept, reject or reshape.

| # | Link | Fixes | Status |
|---|---|---|---|
| 1 | **Rare Research costs some Charge** for the later rares (Pentaquark onward) | Charge gets a sink outside the Wellspring; research ties into the Wellspring | ✅ Built |
| 2 | **Some Experiment requests ask for Charge** (paying extra Data) | Experiments draw on the Wellspring; Charge gets a second sink | ✅ Built (30% of requests once the Wellspring is open) |
| 3 | **New Data upgrade "Conduit Studies":** +X% Conduit strength | Conduit strength gets a second source; Experiments feed the Wellspring | ✅ Built (+10%/level, max 10) |
| 4 | **Resonators boost Experiments:** e.g. the Tetraquark Resonator also adds Data per experiment (or a new Resonator line later) | Experiments get fed from outside | Later (T12 lines or Notes) |
| 5 | **Index gains a Conduit-strength buff** on one particle (e.g. swap one duplicate buff) | Conduit strength gets an Index source | Skipped (Notes can cover it) |
| 6 | **Wellspring feeds rare chance:** e.g. each Coil also adds +2% rare chance ("the beam steadies") | Rare chance gets a Wellspring link | Skipped (muddies what Coils are for) |
| 7 | **Experiments sometimes pay a rare instead of extra Data** | Experiments produce for another system | ✅ Built (25% of requests pay ~10 min of a known rare, on top of Data) |

Planned systems should arrive already linked:
- **Notes** (Cards-like, GDD §6a): found by doing things across systems, and each one boosts a particle or system. That makes them a cross-link hub by design.
- **Ring Schematics:** abilities that touch every system (automation, head starts).
- **Crystal shop:** special upgrades spread across systems.

## 5. Open questions

- How many sources should each headline stat have in the Inner Ring? (Proposal: 4+ for Power, Yield, Charge and rare chance.)
- Should the UI show each stat's breakdown by system? (Proposed earlier as the next build step after this map.)
- Which of the proposed links in §4 should be built now, and which wait for their systems?

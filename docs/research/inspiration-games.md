# Inspiration Games — Research Notes

Research on the three games that inspire this project. The goal is to pull out *which mechanics* are worth borrowing, not to clone any of them.

Project constraints (from the brief):
- Solo hobby project, iOS + Android
- **No ads, ever.** Optional purchases are fine in principle, but monetization isn't a goal.

---

## 1. Idle Obelisk Miner (primary inspiration)

**Core loop:** Mine rocks → craft bars → buy upgrades from several trees → build stats to beat the **Obelisk** (a boss gate). Each Obelisk level you beat unlocks rewards and new content.

**Systems unlock gradually as the Obelisk level rises:**

| Obelisk lvl | Unlock |
|---|---|
| 10 | Challenges |
| 15 | Cards |
| 17 | Pets |
| 18 | Drone fuel (offline/idle automation) |
| 19 | Construct (first big gate) |
| 23 | Stargazing |
| 37 / World 2 | Fishing, Archaeology, Contracts |
| Later | Arcanist (essence → runes → spells), Worlds 3–4 |

**Systems that boost each other (the part you like):**
- **Stargazing:** stars spawn on mining floors (the floor rotates every 30 min). You tap them, or later auto-catch them. Each of the 23 stars buffs a *different* system: pickaxe damage, crafting cost, prestige points, pet level cap, fishing income, and so on. Upgrading a star makes its buff stronger.
- **Fishing:** an idle mini-game. Docks have a "power" stat, and every tick (60 s, can be shortened) a dock may catch fish. Catch chance = dock power ÷ fish power; above 100% you get multiple catches. Fish go to *Notices* (requests), which pay *tokens*, and the tokens buy upgrades that boost **mining** stats. Nothing boosts fishing in return, so it only gives to the rest of the game.
- **Archaeology:** fragments and loot mods, with its own XP.
- **Cards and Statues:** gilding cards makes statues stronger, and statues give permanent multipliers.

**Prestige:** resets Obelisk progress and gives prestige points / **artifacts**. You *keep* permanent upgrades, pet levels, statues, cards and the skill tree, so each run is faster. Players say prestige "plays with a different strategy" each time.

**Pacing:** players warn against rushing ahead. Unlocking World 3 early comes with a −30% game-speed penalty, which is a deliberate way of saying "you're not ready yet."

**Active vs. idle:** you can play actively (tapping, firing bombs, catching stars) or leave it idle (drones, auto-bomb, offline progress). Both are rewarded.

**Monetization:** no ads at all. IAP runs $0.99–$24.99 (multipliers, a founders bundle). Players call it fully F2P-friendly. One criticism: 100% completion needs a paid "founder bomb."

**Main takeaways:**
1. *Mini-games that feed each other.* Each side system is its own small game whose rewards are multipliers *for other systems*.
2. *Unlocks gated by a milestone.* The Obelisk level works as one clear "progress clock" that controls when new systems appear.
3. *Prestige is one layer among several.* It isn't the whole game.

---

## 2. Cell: Idle Factory Incremental (CIFI)

**Theme:** sci-fi. You build and evolve a fleet of production starships to make *Cells*. It won r/incremental_games' Best Mobile Incremental in 2023, 2024 and 2025.

**Structure (several reset layers):**
- **Tick loops:** production runs on "ticks." Upgrades make ticks faster or produce more per tick.
- **Loops (prestige):** resetting earns **Mod Points**, which you spend in **Loop Modifications**, the huge mod tree. Examples: Fast-Loop MK1–MK4 (more Cells, fewer ticks per loop) and Technology Advancement nodes that unlock new generator MKs.
- **Research Center / Research Catalogue:** unlocks after you get a specific ship (The Koios) each reset. Research Points buy boosts to almost everything: Cells, Mod Points, Shards, Research Points, Academy Points, tick speed, token caps, generators.
- Also: skill/talent trees, ship evolution, shards, an academy, mini-games and activities, leaderboards, daily rewards.

**Why it feels like constant progress:** there are many currencies, each with its own upgrade sink, so *something* is always affordable. Mod tree nodes also *unlock* things (new generator tiers), not just add bigger numbers.

**Main takeaways:**
1. *A huge, branching upgrade tree* where some nodes are unlocks, not just "+5%".
2. *Several currencies and upgrade sinks at once*, so every session has something to buy.
3. *Upgrades that make other upgrades cheaper or faster* (research boosts research points).

---

## 3. Cave Heroes: Idle (Dungeon) RPG — VSTGames

**Core loop:** a party of heroes pushes through cave levels, fights demons and bosses, collects loot, builds a village, hires workers, and performs Dark Rituals (prestige-like).

**Pets / events (the part you like):**
- Pets are "assistants of demons" that you **rescue**. Rescue events are **time-limited (about 48 hours)** with a kill or objective target, for example 2,000 kills to unlock a pet.
- Once unlocked, pets help the main game: offline progress, and upgrading Dark Equipment. You level them with pet souls and cursed stones.
- There are also seasonal events (New Year's, etc.) with cosmetic prizes.

**What players complain about:**
- *"If you can't check up consistently through the 48-hour period, you are guaranteed to lose them."* Events punish people who can't play often.
- Some pets take weeks to unlock; players call this a "money trap."
- Grindy overall, which matches your own impression.
- The newer mobile release has **ads + loot boxes**, both of which conflict with this project's values.

**Main takeaways:**
1. *A separate side mode* you can play while waiting on the main game. It has its own rules and rewards that bring something back to the main game.
2. **Avoid:** event windows that require frequent check-ins, and harsh fail states ("you lose the pet").

*Research gap:* public documentation on how Cave Heroes events play out turn by turn is thin. Your own memory of what those events felt like will matter more here than the wikis.

---

## Shared patterns across all three

| Pattern | Obelisk | Cell | Cave Heroes |
|---|---|---|---|
| Several prestige/reset layers | ✓ | ✓✓ | ✓ |
| Side systems that boost each other | ✓✓ | ✓ | ✓ |
| Huge upgrade tree | ✓ | ✓✓ | – |
| Separate side mode / event | ✓ (mini-games) | ✓ (mini-games) | ✓✓ |
| Collectibles (pets/cards/stars) | ✓✓ | – | ✓ |
| Active **or** idle play both rewarded | ✓✓ | ✓ | ✓ |
| No ads | ✓ | ? | ✗ |

## Design risks to keep in mind
- **Too complex:** three games' worth of systems is a lot for a solo dev. Plan to ship a small core first, then add systems.
- **Number balance:** cross-multipliers compound fast, so the math needs a deliberate model early on (likely a spreadsheet or simulation).
- **Grind without payoff:** this is Cave Heroes' weakness, and you already noticed it.

## Sources
- [Idle Obelisk Miner — App Store](https://apps.apple.com/us/app/id6448125670)
- [Idle Obelisk Miner Wiki — Progression Guide](https://shminer.miraheze.org/wiki/Guides/Progression_Guide)
- [Idle Obelisk Miner Wiki — Stargazing](https://shminer.miraheze.org/wiki/Stargazing)
- [Idle Obelisk Miner Wiki — Fishing](https://shminer.miraheze.org/wiki/Fishing)
- [Idle Obelisk Miner Wiki — Archaeology](https://shminer.miraheze.org/wiki/Archaeology)
- [CIFI Wiki — Loop Mods](https://cifi.game-vault.net/wiki/Loop_Mods)
- [CIFI Wiki — Research Center](https://cifi.game-vault.net/wiki/Research_Center)
- [CIFI on BlueStacks](https://www.bluestacks.com/apps/simulation/cell-idle-factory-incremental-on-pc.html)
- [Cave Heroes — Steam](https://store.steampowered.com/app/2631210/Cave_Heroes/)
- [Cave Heroes — "pet system" discussion](https://steamcommunity.com/app/2631210/discussions/0/4137186611102141499/)
- [Cave Heroes: Idle Dungeon RPG — App Store](https://apps.apple.com/hn/app/cave-heroes-idle-dungeon-rpg/id6751492930?l=en-GB)
- [Cave Heroes devlog v5.6.0](https://vstgames.itch.io/cave-heroes/devlog/853014/version-560)

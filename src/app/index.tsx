// Collider tab: the Ring's own upgrades, the band dial, and particles.
import { useLoadedGame } from '../game/GameProvider';
import { BandDial, ParticlesCard } from '../ui/collider';
import { Screen } from '../ui/layout';
import { ConnectionCard } from '../ui/progress';
import { UpgradesCard } from '../ui/upgrades';

export default function ColliderScreen() {
  const { state, dispatch, dev } = useLoadedGame();
  return (
    <Screen>
      <ConnectionCard state={state} dispatch={dispatch} />
      <UpgradesCard state={state} dispatch={dispatch} freeBuys={dev.freeBuys} />
      <BandDial state={state} dispatch={dispatch} />
      <ParticlesCard state={state} />
    </Screen>
  );
}

import { useLoadedGame } from '../../game/GameProvider';
import { Screen, SubHeader } from '../../ui/layout';
import { IndexCard } from '../../ui/particle-index';

export default function ParticleIndexScreen() {
  const { state } = useLoadedGame();
  return (
    <Screen>
      <SubHeader title="Particle Index" parent="/menu" />
      <IndexCard state={state} />
    </Screen>
  );
}

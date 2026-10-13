import { useLoadedGame } from '../../game/GameProvider';
import { Screen, SubHeader } from '../../ui/layout';
import { LoreLogCard } from '../../ui/progress';

export default function LoreScreen() {
  const { state } = useLoadedGame();
  return (
    <Screen>
      <SubHeader title="Operator's notes" parent="/menu" />
      <LoreLogCard state={state} />
    </Screen>
  );
}

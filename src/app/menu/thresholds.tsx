import { useLoadedGame } from '../../game/GameProvider';
import { Screen, SubHeader } from '../../ui/layout';
import { ConnectionCard, ThresholdCard, ThresholdListCard } from '../../ui/progress';

export default function ThresholdsScreen() {
  const { state, dispatch } = useLoadedGame();
  return (
    <Screen>
      <SubHeader title="Thresholds" parent="/menu" />
      <ConnectionCard state={state} dispatch={dispatch} />
      <ThresholdCard state={state} dispatch={dispatch} />
      <ThresholdListCard state={state} startOpen />
    </Screen>
  );
}

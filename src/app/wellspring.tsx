// Wellspring tab: Charge, Conduits, Coils, Taps and Capacitors.
import { useLoadedGame } from '../game/GameProvider';
import { Screen } from '../ui/layout';
import { WellspringCard } from '../ui/upgrades';

export default function WellspringScreen() {
  const { state, dispatch, dev } = useLoadedGame();
  return (
    <Screen>
      <WellspringCard state={state} dispatch={dispatch} freeBuys={dev.freeBuys} />
    </Screen>
  );
}

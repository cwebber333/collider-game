// Recalibrate tab: the prestige reset and the Ring Schematics tree.
import { useLoadedGame } from '../game/GameProvider';
import { hasFeature } from '../economy';
import { LockedPanel, Screen } from '../ui/layout';
import { RecalibrateCard } from '../ui/progress';
import { SchematicsCard } from '../ui/schematics';

export default function RecalibrateScreen() {
  const { state, dispatch } = useLoadedGame();
  if (!hasFeature(state, 'recalibrate')) {
    return (
      <Screen>
        <LockedPanel title="Recalibrate" feature="recalibrate" tease="The Ring could be tuned to resonate deeper, if you knew how." />
      </Screen>
    );
  }
  return (
    <Screen>
      <RecalibrateCard state={state} dispatch={dispatch} />
      <SchematicsCard state={state} dispatch={dispatch} />
    </Screen>
  );
}

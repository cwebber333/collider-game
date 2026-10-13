// One station's page. `[id]` in the file name makes it a dynamic route:
// /stations/experiments opens this screen with id = 'experiments'.
import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { useLoadedGame } from '../../game/GameProvider';
import { Screen, SubHeader } from '../../ui/layout';
import { STATIONS } from '../../ui/navigation';
import { colors } from '../../ui/theme';

export default function StationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch, dev } = useLoadedGame();
  const station = STATIONS.find((s) => s.id === id);
  return (
    <Screen>
      <SubHeader title={station?.name ?? 'Unknown station'} parent="/stations" />
      {station ? (
        <station.Card state={state} dispatch={dispatch} freeBuys={dev.freeBuys} />
      ) : (
        <Text style={{ color: colors.muted }}>Nothing here.</Text>
      )}
    </Screen>
  );
}

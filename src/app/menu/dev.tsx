import { Text } from 'react-native';
import { useLoadedGame } from '../../game/GameProvider';
import { Screen, SubHeader } from '../../ui/layout';
import { DevTools } from '../../ui/misc';
import { colors } from '../../ui/theme';

export default function DevScreen() {
  const { state, dev } = useLoadedGame();
  return (
    <Screen>
      <SubHeader title="Dev tools" parent="/menu" />
      {__DEV__ ? <DevTools state={state} dev={dev} /> : <Text style={{ color: colors.muted }}>Only in development builds.</Text>}
    </Screen>
  );
}

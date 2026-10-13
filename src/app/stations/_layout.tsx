// Stations tab: a hub of tiles, each opening its own page (a stack, so Back works).
import { Stack } from 'expo-router';
import { colors } from '../../ui/theme';

// Opening a station straight from the Menu still puts the hub underneath it.
export const unstable_settings = { initialRouteName: 'index' };

export default function StationsLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}

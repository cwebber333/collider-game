// Menu tab: the grid of everything, plus pages that only live here.
import { Stack } from 'expo-router';
import { colors } from '../../ui/theme';

export const unstable_settings = { initialRouteName: 'index' };

export default function MenuLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}

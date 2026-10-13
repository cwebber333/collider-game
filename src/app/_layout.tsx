// Root layout: providers, the phone-sized frame, and the game shell.
// Every file in src/app/ is a screen; the shell's bottom tabs switch between them.
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GameProvider } from '../game/GameProvider';
import { Shell } from '../ui/shell';
import { colors } from '../ui/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.page}>
        {/* On a laptop browser the game stays phone-width, like on the phone. */}
        <SafeAreaView style={styles.phone}>
          <GameProvider>
            <Shell />
          </GameProvider>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Platform.OS === 'web' ? '#05070b' : colors.bg, alignItems: 'center' },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    backgroundColor: colors.bg,
    ...(Platform.OS === 'web' && { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.cardBorder }),
  },
});

import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { StatId } from './src/economy';
import { useGame } from './src/game/useGame';
import { BreakdownCard } from './src/ui/breakdown';
import { BandDial, ParticlesCard, StatsHeader } from './src/ui/collider';
import { AwayCard, DevTools } from './src/ui/misc';
import { IndexCard } from './src/ui/particle-index';
import { LoreCard, RecalibrateCard, ThresholdCard, ThresholdListCard } from './src/ui/progress';
import { RareResearchCard, ResonatorsCard } from './src/ui/rares';
import { ExperimentsCard } from './src/ui/experiments';
import { colors, space } from './src/ui/theme';
import { UpgradesCard, WellspringCard } from './src/ui/upgrades';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView style={styles.screen}>
        <Game />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Game() {
  const { state, dispatch, away, dismissAway, dev } = useGame();
  // Which stat's breakdown is open (null = none).
  const [inspecting, setInspecting] = useState<StatId | null>(null);
  if (!state) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  const props = { state, dispatch };
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={styles.title}>THE LOST RING</Text>
        <Text style={styles.crystals}>◆ {state.crystals}</Text>
      </View>
      {dev.freeBuys && <Text style={styles.devBanner}>FREE BUYS ON (dev tools)</Text>}
      {away && <AwayCard report={away} onDismiss={dismissAway} />}
      <StatsHeader state={state} onInspect={(stat) => setInspecting(inspecting === stat ? null : stat)} />
      {inspecting && (
        <BreakdownCard state={state} stat={inspecting} onSelect={setInspecting} onClose={() => setInspecting(null)} />
      )}
      <BandDial {...props} />
      <ParticlesCard state={state} />
      <ThresholdCard {...props} />
      <UpgradesCard {...props} freeBuys={dev.freeBuys} />
      <RareResearchCard {...props} freeBuys={dev.freeBuys} />
      <ResonatorsCard {...props} freeBuys={dev.freeBuys} />
      <WellspringCard {...props} freeBuys={dev.freeBuys} />
      <ExperimentsCard {...props} freeBuys={dev.freeBuys} />
      <RecalibrateCard {...props} />
      <ThresholdListCard state={state} />
      <IndexCard state={state} />
      <LoreCard state={state} />
      {__DEV__ && <DevTools state={state} dev={dev} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, gap: space.md, maxWidth: 640, width: '100%', alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 6, textAlign: 'center' },
  // Pinned to the right so the title stays centered.
  crystals: { position: 'absolute', right: 0, color: colors.rare, fontSize: 15, fontWeight: '700' },
  devBanner: { color: colors.warn, fontSize: 12, fontWeight: '700', textAlign: 'center' },
});

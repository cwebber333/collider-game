// Progress-clock cards: the next Threshold, operator notes, Recalibrate.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { INTRO_LORE, THRESHOLDS } from '../data/thresholds';
import {
  canBreach,
  canRecalibrate,
  nextThreshold,
  power,
  resonanceGain,
  stableBand,
  thresholdPowerRequired,
  type Action,
  type GameState,
} from '../economy';
import { Button, Card, ProgressBar } from './common';
import { formatRate } from './format';
import { colors, mono, space } from './theme';

type Props = { state: GameState; dispatch: (action: Action) => void };

export function ThresholdCard({ state, dispatch }: Props) {
  const t = nextThreshold(state);
  if (!t) return null;
  const number = state.breached + 1;
  const required = thresholdPowerRequired(state, t);
  const bandReady = stableBand(state) >= t.afterBand;
  const current = power(state);
  return (
    <Card title={`Threshold T${number}`} right={<Text style={styles.unlocks}>Opens: {t.unlocks}</Text>}>
      <Text style={[styles.check, { color: bandReady ? colors.good : colors.muted }]}>
        {bandReady ? '✓' : '○'} Band {t.afterBand} stable
      </Text>
      <View style={styles.powerLine}>
        <Text style={[styles.check, { color: current >= required ? colors.good : colors.muted }]}>
          {current >= required ? '✓' : '○'} Power
        </Text>
        <Text style={styles.powerNumbers}>
          {formatRate(current)} / {formatRate(required)}
        </Text>
      </View>
      <ProgressBar progress={current / required} />
      <Button label={`Breach T${number}`} disabled={!canBreach(state)} onPress={() => dispatch({ type: 'breach' })} />
    </Card>
  );
}

export function LoreCard({ state }: { state: GameState }) {
  const note = state.breached === 0 ? INTRO_LORE : THRESHOLDS[state.breached - 1].lore;
  return (
    <Card title={state.breached === 0 ? 'Note on the console' : `Operator's note · T${state.breached}`}>
      <Text style={styles.lore}>“{note}”</Text>
    </Card>
  );
}

export function RecalibrateCard({ state, dispatch }: Props) {
  // Two-tap confirm: the first tap arms the button for a few seconds.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  if (!canRecalibrate(state)) return null;
  const gain = resonanceGain(state);
  return (
    <Card title="Recalibrate" right={<Text style={styles.unlocks}>Resonance {state.resonance}</Text>}>
      <Text style={styles.body}>
        Resets particles and all upgrades (Wellspring too). Keeps the Particle Index and breached Thresholds.
      </Text>
      <Text style={styles.body}>
        Gain <Text style={{ color: colors.rare, fontWeight: '700' }}>+{gain} Resonance</Text>. (Ring Schematics to spend it on are coming.)
      </Text>
      <Button
        label={armed ? 'Tap again to Recalibrate' : `Recalibrate (+${gain})`}
        tone="warn"
        onPress={() => {
          if (!armed) return setArmed(true);
          setArmed(false);
          dispatch({ type: 'recalibrate' });
        }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  unlocks: { color: colors.muted, fontSize: 12, flexShrink: 1, textAlign: 'right', marginLeft: space.sm },
  check: { fontSize: 14 },
  powerLine: { flexDirection: 'row', justifyContent: 'space-between' },
  powerNumbers: { color: colors.text, fontFamily: mono, fontSize: 14 },
  lore: { color: colors.text, fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  body: { color: colors.text, fontSize: 13, lineHeight: 18 },
});

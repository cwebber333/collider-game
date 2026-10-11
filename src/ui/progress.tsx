// Progress-clock cards: the next Threshold, operator notes, Recalibrate.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FEATURES } from '../data/features';
import { INTRO_LORE, THRESHOLDS, type ThresholdReward } from '../data/thresholds';
import {
  canBreach,
  canRecalibrate,
  nextThreshold,
  power,
  resonanceGain,
  thresholdPowerRequired,
  type Action,
  type GameState,
} from '../economy';
import { Button, Card, ProgressBar } from './common';
import { formatCost, formatRate } from './format';
import { colors, mono, space } from './theme';

type Props = { state: GameState; dispatch: (action: Action) => void };

/** One line describing a Threshold's reward. */
export function rewardText(reward: ThresholdReward): string {
  switch (reward.kind) {
    case 'unlock':
    case 'milestone':
      return FEATURES[reward.feature].name;
    case 'bonus':
      return reward.bonus === 'power'
        ? `+${Math.round(reward.amount * 100)}% Power`
        : `Offline cap +${Math.round(reward.amount / 3600)}h`;
  }
}

/** True when the reward is a system that isn't built yet. */
function comingSoon(reward: ThresholdReward): boolean {
  return reward.kind !== 'bonus' && !FEATURES[reward.feature].built;
}

export function ThresholdCard({ state, dispatch }: Props) {
  const t = nextThreshold(state);
  if (!t) return null;
  const number = state.breached + 1;
  const required = thresholdPowerRequired(state, t);
  const current = power(state);
  return (
    <Card title={`Threshold T${number}`} right={<Text style={styles.crystals}>+{t.crystals} ◆</Text>}>
      <Text style={styles.reward}>
        Reward: <Text style={styles.rewardName}>{rewardText(t.reward)}</Text>
        {comingSoon(t.reward) && <Text style={styles.soon}> (coming soon)</Text>}
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

/** Every Threshold: what's done, what's next, what's ahead. */
export function ThresholdListCard({ state }: { state: GameState }) {
  const [open, setOpen] = useState(false);
  return (
    <Card
      title="Thresholds"
      right={
        <Pressable onPress={() => setOpen(!open)} hitSlop={12}>
          <Text style={styles.toggle}>
            {state.breached}/{THRESHOLDS.length} breached · {state.crystals} ◆ {open ? '▲' : '▼'}
          </Text>
        </Pressable>
      }
    >
      {open &&
        THRESHOLDS.map((t, i) => {
          const done = i < state.breached;
          const next = i === state.breached;
          return (
            <View key={i} style={styles.listRow}>
              <Text style={[styles.listNumber, done && { color: colors.good }, next && { color: colors.accent }]}>
                {done ? '✓' : next ? '›' : ' '} T{i + 1}
              </Text>
              <Text style={[styles.listReward, !done && !next && { color: colors.muted }]}>
                {rewardText(t.reward)}
                {comingSoon(t.reward) && <Text style={styles.soon}> (soon)</Text>}
              </Text>
              <Text style={styles.listPower}>{formatCost(t.power)}</Text>
            </View>
          );
        })}
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
  crystals: { color: colors.rare, fontSize: 13, fontWeight: '700' },
  reward: { color: colors.muted, fontSize: 13 },
  rewardName: { color: colors.text, fontWeight: '700' },
  soon: { color: colors.faint, fontStyle: 'italic' },
  toggle: { color: colors.accent, fontSize: 12 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  listNumber: { width: 44, color: colors.faint, fontFamily: mono, fontSize: 13 },
  listReward: { flex: 1, color: colors.text, fontSize: 13 },
  listPower: { color: colors.muted, fontFamily: mono, fontSize: 12 },
  check: { fontSize: 14 },
  powerLine: { flexDirection: 'row', justifyContent: 'space-between' },
  powerNumbers: { color: colors.text, fontFamily: mono, fontSize: 14 },
  lore: { color: colors.text, fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  body: { color: colors.text, fontSize: 13, lineHeight: 18 },
});

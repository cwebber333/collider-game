// Trials: goals with a twist, completed during normal play, paying Marks.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TRIAL_UPGRADE_IDS, TRIAL_UPGRADES, TRIALS, type TrialUpgradeId } from '../data/trials';
import {
  hasFeature,
  thresholdFor,
  trialLevel,
  trialUpgradeCost,
  type Action,
  type GameState,
} from '../economy';
import { Button, Card } from './common';
import { colors, mono, space } from './theme';

type Props = { state: GameState; dispatch: (action: Action) => void };

function TrialUpgradeRow({ state, dispatch, id }: Props & { id: TrialUpgradeId }) {
  const def = TRIAL_UPGRADES[id];
  const cost = trialUpgradeCost(state, id);
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.name}>
          {def.name}{' '}
          <Text style={styles.level}>
            Lv {trialLevel(state, id)}/{def.maxLevel}
          </Text>
        </Text>
        <Text style={styles.description}>{def.description}</Text>
      </View>
      <View style={styles.buy}>
        <Button
          label="Buy"
          small
          disabled={cost === null || state.trials.marks < cost}
          onPress={() => dispatch({ type: 'buyTrialUpgrade', upgrade: id })}
        />
        <Text style={[styles.cost, { color: cost !== null && state.trials.marks >= cost ? colors.good : colors.bad }]}>
          {cost === null ? 'Maxed' : `${cost} Marks`}
        </Text>
      </View>
    </View>
  );
}

export function TrialsCard(props: Props) {
  const { state } = props;
  const [showDone, setShowDone] = useState(false);
  if (!hasFeature(state, 'trials')) {
    return (
      <Card title="Trials">
        <Text style={styles.tease}>Someone ran the Ring with half its systems off. (Breach T{thresholdFor('trials')})</Text>
      </Card>
    );
  }
  const done = TRIALS.filter((t) => state.trials.completed.includes(t.id));
  const open = TRIALS.filter((t) => !state.trials.completed.includes(t.id));
  return (
    <Card title="Trials" right={<Text style={styles.marks}>{state.trials.marks} Marks</Text>}>
      <Text style={styles.description}>
        Goals with a twist. They complete on their own during normal play. Permanent.
      </Text>
      {open.map((t) => (
        <View key={t.id} style={styles.trial}>
          <Text style={styles.name}>
            {t.name} <Text style={styles.reward}>+{t.marks} Marks</Text>
          </Text>
          <Text style={styles.description}>{t.description}</Text>
        </View>
      ))}
      {done.length > 0 && (
        <Pressable onPress={() => setShowDone(!showDone)} hitSlop={8}>
          <Text style={styles.toggle}>
            {done.length}/{TRIALS.length} completed {showDone ? '▲' : '▼'}
          </Text>
        </Pressable>
      )}
      {showDone && done.map((t) => <Text key={t.id} style={styles.done}>✓ {t.name}</Text>)}
      <Text style={styles.section}>Trial upgrades</Text>
      {TRIAL_UPGRADE_IDS.map((id) => <TrialUpgradeRow key={id} id={id} {...props} />)}
    </Card>
  );
}

const styles = StyleSheet.create({
  marks: { color: colors.warn, fontFamily: mono, fontSize: 14, fontWeight: '700' },
  tease: { color: colors.muted, fontSize: 13, fontStyle: 'italic' },
  description: { color: colors.muted, fontSize: 12 },
  trial: { gap: 2, paddingVertical: space.xs },
  reward: { color: colors.warn, fontWeight: '400', fontSize: 12 },
  toggle: { color: colors.accent, fontSize: 12 },
  done: { color: colors.good, fontSize: 13 },
  section: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  rowMain: { flex: 1, gap: 2 },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  level: { color: colors.muted, fontWeight: '400', fontSize: 13 },
  buy: { alignItems: 'flex-end', gap: 2, minWidth: 84 },
  cost: { fontFamily: mono, fontSize: 13 },
});

// Experiments: the request board, Data, and Data upgrades.
import { StyleSheet, Text, View } from 'react-native';
import { DATA_UPGRADE_IDS, DATA_UPGRADES, type DataUpgradeId } from '../data/experiments';
import { PARTICLES } from '../data/particles';
import {
  canCompleteExperiment,
  canSkipExperiment,
  dataLevel,
  dataUpgradeCost,
  hasFeature,
  requestCost,
  requestData,
  thresholdFor,
  type Action,
  type GameState,
} from '../economy';
import { Button, Card } from './common';
import { CostLines } from './cost';
import { formatDuration } from './format';
import { colors, mono, space } from './theme';

/** `freeBuys`: dev mode where purchases cost nothing. */
type Props = { state: GameState; dispatch: (action: Action) => void; freeBuys?: boolean };

function DataUpgradeRow({ state, dispatch, freeBuys, id }: Props & { id: DataUpgradeId }) {
  const def = DATA_UPGRADES[id];
  const cost = dataUpgradeCost(state, id);
  const affordable = cost !== null && (freeBuys || state.experiments.data >= cost);
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.name}>
          {def.name}{' '}
          <Text style={styles.level}>
            Lv {dataLevel(state, id)}/{def.maxLevel}
          </Text>
        </Text>
        <Text style={styles.description}>{def.description}</Text>
      </View>
      <View style={styles.buy}>
        <Button label="Buy" small disabled={!affordable} onPress={() => dispatch({ type: 'buyDataUpgrade', upgrade: id })} />
        <Text style={[styles.cost, { color: cost !== null && state.experiments.data >= cost ? colors.good : colors.bad }]}>
          {cost === null ? 'Maxed' : `${cost} Data`}
        </Text>
      </View>
    </View>
  );
}

export function ExperimentsCard(props: Props) {
  const { state, dispatch, freeBuys } = props;
  if (!hasFeature(state, 'experiments')) {
    return (
      <Card title="Experiments">
        <Text style={styles.tease}>A list of experiments sits on the console, half crossed out. (Breach T{thresholdFor('experiments')})</Text>
      </Card>
    );
  }
  const skipWait = state.experiments.nextSkipAt - state.elapsed;
  return (
    <Card title="Experiments" right={<Text style={styles.data}>{state.experiments.data} Data</Text>}>
      <Text style={styles.description}>
        Deliver particles to finish an experiment. Requests never expire. Resets on Recalibrate.
      </Text>
      {state.experiments.requests.map((request, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.rowMain}>
            <Text style={styles.name}>Experiment {state.experiments.completed + index + 1}</Text>
            <Text style={styles.reward}>
              Pays {requestData(state, request)} Data
              {request.rareReward && (
                <Text style={styles.rareReward}>
                  {' '}
                  + {request.rareReward.amount} {PARTICLES[request.rareReward.rare].name}
                </Text>
              )}
            </Text>
            <Button
              label={canSkipExperiment(state) ? 'Skip' : `Skip in ${formatDuration(skipWait)}`}
              small
              tone="muted"
              disabled={!canSkipExperiment(state)}
              onPress={() => dispatch({ type: 'skipExperiment', index })}
            />
          </View>
          <View style={styles.buy}>
            <Button
              label="Complete"
              small
              disabled={!freeBuys && !canCompleteExperiment(state, index)}
              onPress={() => dispatch({ type: 'completeExperiment', index })}
            />
            <CostLines state={state} cost={requestCost(state, request)} />
          </View>
        </View>
      ))}
      <Text style={styles.section}>Data upgrades</Text>
      {DATA_UPGRADE_IDS.map((id) => <DataUpgradeRow key={id} id={id} {...props} />)}
    </Card>
  );
}

const styles = StyleSheet.create({
  data: { color: colors.accent, fontFamily: mono, fontSize: 14, fontWeight: '700' },
  tease: { color: colors.muted, fontSize: 13, fontStyle: 'italic' },
  description: { color: colors.muted, fontSize: 12 },
  section: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  rowMain: { flex: 1, gap: 4, alignItems: 'flex-start' },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  level: { color: colors.muted, fontWeight: '400', fontSize: 13 },
  reward: { color: colors.accent, fontSize: 13 },
  rareReward: { color: colors.rare, fontWeight: '700' },
  buy: { alignItems: 'flex-end', gap: 2, minWidth: 84 },
  cost: { fontFamily: mono, fontSize: 13 },
});

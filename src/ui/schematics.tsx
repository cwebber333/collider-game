// Ring Schematics: the permanent tree bought with Resonance.
import { StyleSheet, Switch, Text, View } from 'react-native';
import {
  SCHEMATIC_BRANCHES,
  SCHEMATIC_IDS,
  SCHEMATICS,
  type SchematicBranch,
  type SchematicId,
} from '../data/schematics';
import {
  canBuySchematic,
  hasAutomation,
  hasFeature,
  hasSchematic,
  isSchematicAvailable,
  thresholdFor,
  type Action,
  type GameState,
} from '../economy';
import { Button, Card } from './common';
import { colors, mono, space } from './theme';

type Props = { state: GameState; dispatch: (action: Action) => void };

const BRANCHES = Object.keys(SCHEMATIC_BRANCHES) as SchematicBranch[];

function NodeRow({ state, dispatch, id }: Props & { id: SchematicId }) {
  const def = SCHEMATICS[id];
  const owned = hasSchematic(state, id);
  const available = isSchematicAvailable(state, id);
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={[styles.name, owned && { color: colors.good }, !owned && !available && { color: colors.muted }]}>
          {owned ? '✓ ' : ''}
          {def.name}
        </Text>
        <Text style={styles.description}>{def.description}</Text>
        {!owned && def.requires && !hasSchematic(state, def.requires) && (
          <Text style={styles.locked}>Needs {SCHEMATICS[def.requires].name}</Text>
        )}
      </View>
      {!owned && (
        <View style={styles.buy}>
          <Button
            label="Build"
            small
            disabled={!canBuySchematic(state, id)}
            onPress={() => dispatch({ type: 'buySchematic', schematic: id })}
          />
          <Text style={[styles.cost, { color: state.resonance >= def.cost ? colors.good : colors.bad }]}>{def.cost} ◎</Text>
        </View>
      )}
    </View>
  );
}

export function SchematicsCard(props: Props) {
  const { state, dispatch } = props;
  if (!hasFeature(state, 'recalibrate')) return null;
  return (
    <Card title="Ring Schematics" right={<Text style={styles.resonance}>◎ {state.resonance} Resonance</Text>}>
      <Text style={styles.description}>
        Permanent. Bought with Resonance from Recalibrate. Schematics give abilities and head starts.
      </Text>
      {hasAutomation(state, 'buy') && (
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Auto-Buy Collider upgrades</Text>
          <Switch value={state.autoBuy} onValueChange={(on) => dispatch({ type: 'setAutoBuy', on })} />
        </View>
      )}
      {BRANCHES.map((branch) => {
        const info = SCHEMATIC_BRANCHES[branch];
        const open = hasFeature(state, info.unlockedBy);
        return (
          <View key={branch} style={styles.branch}>
            <Text style={styles.branchName}>
              {info.name} <Text style={styles.branchBlurb}>· {info.blurb}</Text>
            </Text>
            {open ? (
              SCHEMATIC_IDS.filter((id) => SCHEMATICS[id].branch === branch).map((id) => (
                <NodeRow key={id} id={id} {...props} />
              ))
            ) : (
              <Text style={styles.locked}>Opens at T{thresholdFor(info.unlockedBy)}</Text>
            )}
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  resonance: { color: colors.rare, fontFamily: mono, fontSize: 13, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 12 },
  branch: { gap: 2, marginTop: space.sm },
  branchName: { color: colors.accent, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  branchBlurb: { color: colors.muted, fontWeight: '400', letterSpacing: 0 },
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
  locked: { color: colors.warn, fontSize: 12 },
  buy: { alignItems: 'flex-end', gap: 2, minWidth: 84 },
  cost: { fontFamily: mono, fontSize: 13 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { color: colors.text, fontSize: 13 },
});

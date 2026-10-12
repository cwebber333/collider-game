// Upgrade lists: the collider's own upgrades and the Wellspring.
import { StyleSheet, Text, View } from 'react-native';
import { UPGRADES, type UpgradeId } from '../data/upgrades';
import {
  basePower,
  canAfford,
  chargeRate,
  conduitStrength,
  energy,
  isMaxed,
  isUnlocked,
  stableBand,
  thresholdFor,
  upgradeCost,
  type Action,
  type GameState,
} from '../economy';
import { Button, Card } from './common';
import { CostLines } from './cost';
import { formatAmount, formatRate } from './format';
import { colors, mono, space } from './theme';

/** `freeBuys`: dev mode where purchases cost nothing. */
type Props = { state: GameState; dispatch: (action: Action) => void; freeBuys?: boolean };

const COLLIDER: UpgradeId[] = ['beamCurrent', 'collectorGrid', 'ringSpeed', 'sensitivity'];
const WELLSPRING: UpgradeId[] = ['conduits', 'coils', 'taps'];

/** One line describing what the upgrade does for you right now. */
function currentEffect(state: GameState, id: UpgradeId): string {
  const level = state.levels[id];
  const per = UPGRADES[id].perLevel;
  switch (id) {
    case 'ringSpeed':
      return `Energy ${formatRate(energy(state))} · stable to band ${stableBand(state)}`;
    case 'beamCurrent':
      return `Power ×${formatRate(per ** level)}`;
    case 'collectorGrid':
      return `Yield +${formatRate(per * level)}`;
    case 'sensitivity':
      return `Rare chance +${Math.round(per * level * 100)}%`;
    case 'conduits':
      return `Base Power ${formatRate(basePower(state))}`;
    case 'taps':
      return `Charge ×${formatRate(per ** level)}`;
    case 'coils':
      return `Each Conduit +${formatRate(conduitStrength(state))} base Power`;
  }
}

/** Why there's no cost to show, if there isn't one. */
function unavailableReason(state: GameState, id: UpgradeId): string | null {
  if (isMaxed(state, id)) return 'Maxed';
  return null;
}

function UpgradeRow({ state, dispatch, freeBuys, id }: Props & { id: UpgradeId }) {
  const def = UPGRADES[id];
  const cost = upgradeCost(state, id);
  const affordable = cost !== null && (freeBuys || canAfford(state, cost));
  const reason = unavailableReason(state, id);
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.name}>
          {def.name} <Text style={styles.level}>Lv {state.levels[id]}</Text>
        </Text>
        <Text style={styles.effect}>{currentEffect(state, id)}</Text>
        <Text style={styles.description}>{def.description}</Text>
        {!cost && reason && <Text style={styles.reason}>{reason}</Text>}
      </View>
      {/* Cost sits right under the button that pays it. */}
      <View style={styles.buy}>
        <Button label="Buy" small disabled={!affordable} onPress={() => dispatch({ type: 'buy', upgrade: id })} />
        {cost && <CostLines state={state} cost={cost} />}
      </View>
    </View>
  );
}

export function UpgradesCard(props: Props) {
  return (
    <Card title="Upgrades">
      {COLLIDER.map((id) => <UpgradeRow key={id} id={id} {...props} />)}
    </Card>
  );
}

export function WellspringCard(props: Props) {
  if (!isUnlocked(props.state, 'conduits')) {
    return (
      <Card title="Wellspring">
        <Text style={styles.tease}>Something below the Ring is humming. (Breach T{thresholdFor('wellspring')})</Text>
      </Card>
    );
  }
  const { state } = props;
  return (
    <Card title="Wellspring" right={<Text style={styles.charge}>⚡ {formatAmount(state.charge)}</Text>}>
      <Text style={styles.description}>
        Charge gathers on its own: +{formatRate(chargeRate(state))}/s. Nobody knows where it comes from.
      </Text>
      {WELLSPRING.map((id) => <UpgradeRow key={id} id={id} {...props} />)}
    </Card>
  );
}

const styles = StyleSheet.create({
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
  effect: { color: colors.accent, fontSize: 13 },
  description: { color: colors.muted, fontSize: 12 },
  buy: { alignItems: 'flex-end', gap: 2, minWidth: 84 },
  charge: { color: colors.warn, fontFamily: mono, fontSize: 14, fontWeight: '700' },
  reason: { color: colors.warn, fontSize: 12, marginTop: 2 },
  tease: { color: colors.muted, fontSize: 13, fontStyle: 'italic' },
});

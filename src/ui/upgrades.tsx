// Upgrade lists: the collider's own upgrades and, after T2, the Wellspring.
import { StyleSheet, Text, View } from 'react-native';
import { PARTICLES, type ParticleId } from '../data/particles';
import { UPGRADES, type UpgradeId } from '../data/upgrades';
import {
  canAfford,
  energy,
  isMaxed,
  isUnlocked,
  stableBand,
  thresholdFor,
  upgradeCost,
  wellspringPowerMult,
  type Action,
  type GameState,
} from '../economy';
import { Button, Card } from './common';
import { formatCost, formatRate } from './format';
import { colors, mono, space } from './theme';

/** `freeBuys`: dev mode where purchases cost nothing. */
type Props = { state: GameState; dispatch: (action: Action) => void; freeBuys?: boolean };

const COLLIDER: UpgradeId[] = ['ringSpeed', 'beamCurrent', 'collectorGrid', 'sensitivity'];
const WELLSPRING: UpgradeId[] = ['conduits', 'stabilizers'];

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
    case 'sensitivity': {
      const nextReveal = Object.values(PARTICLES)
        .map((p) => p.rare?.revealLevel ?? 0)
        .filter((reveal) => reveal > level)
        .sort((a, b) => a - b)[0];
      const chance = level > 0 ? `Rare chance +${Math.round(per * level * 100)}%` : 'No rares detected';
      return nextReveal ? `${chance} · new signal at Lv ${nextReveal}` : chance;
    }
    case 'conduits':
      return `Power ×${formatRate(wellspringPowerMult(state))}`;
    case 'stabilizers':
      return `Density −${Math.round((1 - (1 - per) ** level) * 100)}%`;
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
        {cost &&
          (Object.entries(cost) as [ParticleId, number][]).map(([pid, amount]) => (
            <Text key={pid} style={[styles.cost, { color: state.particles[pid] >= amount ? colors.good : colors.bad }]}>
              {PARTICLES[pid].symbol} {formatCost(amount)}
            </Text>
          ))}
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
  return (
    <Card title="Wellspring">
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
  cost: { fontFamily: mono, fontSize: 13 },
  reason: { color: colors.warn, fontSize: 12, marginTop: 2 },
  tease: { color: colors.muted, fontSize: 13, fontStyle: 'italic' },
});

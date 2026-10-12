// A cost shown as one line per resource, green when affordable, red when not.
import { StyleSheet, Text } from 'react-native';
import { PARTICLES } from '../data/particles';
import type { Resource } from '../data/resources';
import { balance, costEntries, type Cost, type GameState } from '../economy';
import { formatCost } from './format';
import { colors, mono } from './theme';

/** Short label for any resource: the particle symbol, or ⚡ for Charge. */
export function resourceSymbol(r: Resource): string {
  return r === 'charge' ? '⚡' : PARTICLES[r].symbol;
}

export function CostLines({ state, cost }: { state: GameState; cost: Cost }) {
  return (
    <>
      {costEntries(cost).map(([r, amount]) => (
        <Text key={r} style={[styles.cost, { color: balance(state, r) >= amount ? colors.good : colors.bad }]}>
          {resourceSymbol(r)} {formatCost(amount)}
        </Text>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  cost: { fontFamily: mono, fontSize: 13 },
});

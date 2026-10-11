// Rare Research: the rares you can detect, and the next one to unlock.
import { StyleSheet, Text, View } from 'react-native';
import { BANDS } from '../data/bands';
import { PARTICLES, type ParticleId } from '../data/particles';
import { RARE_CHAIN } from '../data/rares';
import {
  canResearch,
  hasFeature,
  nextResearch,
  researchCost,
  thresholdFor,
  type Action,
  type GameState,
} from '../economy';
import { Button, Card } from './common';
import { formatAmount, formatCost } from './format';
import { colors, mono, space } from './theme';

/** `freeBuys`: dev mode where purchases cost nothing. */
type Props = { state: GameState; dispatch: (action: Action) => void; freeBuys?: boolean };

/** "bands 3–4" for the bands a rare appears on. */
function rareBands(id: ParticleId): string {
  const bands = BANDS.filter((b) => b.rare === id).map((b) => b.band);
  return bands.length > 1 ? `bands ${bands[0]}–${bands[bands.length - 1]}` : `band ${bands[0]}`;
}

export function RareResearchCard({ state, dispatch, freeBuys }: Props) {
  const known = RARE_CHAIN.filter((r) => state.rares.includes(r.rare));
  const next = nextResearch(state);
  const cost = researchCost(state);
  const unlocked = hasFeature(state, 'rareResearch');
  return (
    <Card title="Rare Research" right={<Text style={styles.count}>{known.length}/{RARE_CHAIN.length} rares</Text>}>
      <View style={styles.known}>
        {known.map(({ rare }) => (
          <Text key={rare} style={styles.rare}>
            {PARTICLES[rare].symbol} {PARTICLES[rare].name}{' '}
            <Text style={styles.amount}>{formatAmount(state.particles[rare], true)}</Text>
            <Text style={styles.bands}> · {rareBands(rare)}</Text>
          </Text>
        ))}
      </View>

      {next && !unlocked && (
        <Text style={styles.tease}>More signals hide in the noise. (Breach T{thresholdFor('rareResearch')})</Text>
      )}

      {next && unlocked && cost && (
        <View style={styles.row}>
          <View style={styles.rowMain}>
            <Text style={styles.name}>Research: {PARTICLES[next.rare].name}</Text>
            <Text style={styles.description}>Lets the Ring detect it on {rareBands(next.rare)}.</Text>
          </View>
          <View style={styles.buy}>
            <Button label="Research" small disabled={!freeBuys && !canResearch(state)} onPress={() => dispatch({ type: 'research' })} />
            {(Object.entries(cost) as [ParticleId, number][]).map(([pid, amount]) => (
              <Text
                key={pid}
                style={[styles.cost, { color: state.particles[pid] >= amount ? colors.good : colors.bad }]}
              >
                {PARTICLES[pid].symbol} {formatCost(amount)}
              </Text>
            ))}
          </View>
        </View>
      )}

      {!next && <Text style={styles.description}>Every Inner Ring rare is known.</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  count: { color: colors.muted, fontSize: 12 },
  known: { gap: 2 },
  rare: { color: colors.rare, fontSize: 14 },
  amount: { color: colors.text, fontFamily: mono, fontSize: 13 },
  bands: { color: colors.muted, fontSize: 12 },
  tease: { color: colors.muted, fontSize: 13, fontStyle: 'italic' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  rowMain: { flex: 1, gap: 2 },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 12 },
  buy: { alignItems: 'flex-end', gap: 2, minWidth: 84 },
  cost: { fontFamily: mono, fontSize: 13 },
});

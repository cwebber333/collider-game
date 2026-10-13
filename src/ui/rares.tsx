// Rare Research: the rares you can detect, and the next one to unlock.
import { StyleSheet, Text, View } from 'react-native';
import { BANDS } from '../data/bands';
import { PARTICLES, type ParticleId } from '../data/particles';
import { RARE_CHAIN } from '../data/rares';
import { RESONATORS, type ResonatorDef } from '../data/resonators';
import {
  canAfford,
  canResearch,
  hasFeature,
  isResonatorUnlocked,
  resonatorCost,
  resonatorLevel,
  nextResearch,
  researchCost,
  thresholdFor,
  type Action,
  type GameState,
} from '../economy';
import { Button, Card } from './common';
import { CostLines } from './cost';
import { formatAmount } from './format';
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
            <CostLines state={state} cost={cost} />
          </View>
        </View>
      )}

      {!next && <Text style={styles.description}>Every Inner Ring rare is known.</Text>}
    </Card>
  );
}

/** What a Resonator gives at a level, e.g. "+16% Yield". */
function resonatorEffect(def: ResonatorDef, level: number): string {
  const total = def.perLevel * level;
  const pct = `${Math.round(total * 100)}%`;
  switch (def.effect) {
    case 'yield':
      return `+${pct} Yield`;
    case 'power':
      return `+${pct} Power`;
    case 'data':
      return `+${pct} Data from Experiments`;
    case 'wellspring':
      return `+${pct} Wellspring output`;
    case 'indexRequirement':
      return `Index levels need ${Math.round((1 - (1 - def.perLevel) ** level) * 100)}% fewer particles`;
    case 'resonance':
      return `+${pct} Resonance`;
  }
}

function ResonatorRow({ state, dispatch, freeBuys, def }: Props & { def: ResonatorDef }) {
  const level = resonatorLevel(state, def.rare);
  const unlocked = isResonatorUnlocked(state, def.rare);
  const cost = resonatorCost(state, def.rare);
  const affordable = cost !== null && (freeBuys || canAfford(state, cost));
  let lockedReason: string | null = null;
  if (!hasFeature(state, def.unlockedBy)) lockedReason = `Unlocks at T${thresholdFor(def.unlockedBy)}`;
  else if (!state.rares.includes(def.rare)) lockedReason = `Research the ${PARTICLES[def.rare].name} first`;
  else if (!cost) lockedReason = 'Maxed';
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={[styles.name, !unlocked && { color: colors.muted }]}>
          {def.name} <Text style={styles.level}>Lv {level}</Text>
        </Text>
        <Text style={styles.effect}>
          {level > 0 ? resonatorEffect(def, level) : 'Not built'} · next: {resonatorEffect(def, level + 1)}
        </Text>
        {lockedReason && <Text style={styles.locked}>{lockedReason}</Text>}
      </View>
      {cost && (
        <View style={styles.buy}>
          <Button
            label={level > 0 ? 'Tune' : 'Build'}
            small
            disabled={!affordable}
            onPress={() => dispatch({ type: 'buildResonator', rare: def.rare })}
          />
          <CostLines state={state} cost={cost} />
        </View>
      )}
    </View>
  );
}

export function ResonatorsCard(props: Props) {
  if (!hasFeature(props.state, 'resonators')) {
    return (
      <Card title="Resonators">
        <Text style={styles.tease}>Old machines hum when rares pass through them. (Breach T{thresholdFor('resonators')})</Text>
      </Card>
    );
  }
  return (
    <Card title="Resonators">
      <Text style={styles.description}>Permanent: kept through Recalibrate.</Text>
      {RESONATORS.map((def) => <ResonatorRow key={def.rare} def={def} {...props} />)}
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
  level: { color: colors.muted, fontWeight: '400', fontSize: 13 },
  effect: { color: colors.accent, fontSize: 13 },
  locked: { color: colors.warn, fontSize: 12 },
});

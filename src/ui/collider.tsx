// The Ring itself: headline stats, the band dial, and what it's producing.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BANDS } from '../data/bands';
import { PARTICLE_IDS, PARTICLES, type ParticleId } from '../data/particles';
import { THRESHOLDS } from '../data/thresholds';
import {
  bandCap,
  bandDef,
  bandEfficiency,
  collisionsPerSecond,
  energy,
  particleYield,
  power,
  productionRates,
  stableBand,
  type Action,
  type GameState,
} from '../economy';
import { Card } from './common';
import { formatAmount, formatPercent, formatRate } from './format';
import { colors, mono, space } from './theme';

type Props = { state: GameState; dispatch: (action: Action) => void };

/** Has the player's Sensitivity revealed this rare yet? */
export function rareRevealed(state: GameState, id: ParticleId): boolean {
  return state.levels.sensitivity >= (PARTICLES[id].rare?.revealLevel ?? 0);
}

export function StatsHeader({ state }: { state: GameState }) {
  const stats: [string, string][] = [
    ['Power', formatRate(power(state))],
    ['Yield', formatRate(particleYield(state))],
    ['Energy', formatRate(energy(state))],
    ['Collisions/s', formatRate(collisionsPerSecond(state, state.selectedBand))],
  ];
  return (
    <View style={styles.statsRow}>
      {stats.map(([label, value]) => (
        <View key={label} style={styles.stat}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

export function BandDial({ state, dispatch }: Props) {
  const cap = bandCap(state);
  const stable = stableBand(state);
  return (
    <Card title="Band" right={<Text style={styles.hint}>Stable to band {stable}</Text>}>
      <View style={styles.dial}>
        {BANDS.map(({ band, mix, rare }) => {
          const locked = band > cap;
          const selected = band === state.selectedBand;
          const efficiency = bandEfficiency(state, band);
          // Thresholds standing between band 1 and this band (T1 for bands 5–8, …).
          const thresholdsNeeded = THRESHOLDS.filter((t) => t.afterBand < band).length;
          // Top two particles by share, for a quick hint of what the band makes.
          const top = (Object.entries(mix) as [ParticleId, number][])
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([id]) => PARTICLES[id].symbol)
            .join(' ');
          return (
            <Pressable
              key={band}
              disabled={locked}
              onPress={() => dispatch({ type: 'selectBand', band })}
              style={[
                styles.chip,
                selected && styles.chipSelected,
                locked && styles.chipLocked,
              ]}
            >
              <Text style={[styles.chipBand, locked && { color: colors.faint }]}>{band}</Text>
              {locked ? (
                <Text style={styles.chipSub}>T{thresholdsNeeded}</Text>
              ) : (
                <>
                  <Text style={[styles.chipSub, efficiency < 1 && { color: colors.warn }]}>
                    {efficiency < 1 ? formatPercent(efficiency) : top}
                  </Text>
                  {rare && (
                    <Text style={[styles.chipRare, !rareRevealed(state, rare) && { color: colors.faint }]}>
                      {rareRevealed(state, rare) ? PARTICLES[rare].symbol : '?'}
                    </Text>
                  )}
                </>
              )}
            </Pressable>
          );
        })}
      </View>
      {bandEfficiency(state, state.selectedBand) < 1 && (
        <Text style={styles.warn}>
          Not enough energy for band {state.selectedBand}: running at {formatPercent(bandEfficiency(state, state.selectedBand))}.
          Upgrade Ring Speed to stabilize it.
        </Text>
      )}
    </Card>
  );
}

export function ParticlesCard({ state }: { state: GameState }) {
  const rates = productionRates(state);
  const shown = PARTICLE_IDS.filter((id) => state.lifetime[id] > 0 || rates[id] > 0);
  const bandRare = bandDef(state.selectedBand).rare;
  return (
    <Card title="Particles">
      {shown.map((id) => {
        const isRare = PARTICLES[id].rare !== undefined;
        return (
          <View key={id} style={styles.particleRow}>
            <Text style={[styles.symbol, isRare && { color: colors.rare }]}>{PARTICLES[id].symbol}</Text>
            <Text style={[styles.particleName, isRare && { color: colors.rare }]}>{PARTICLES[id].name}</Text>
            <Text style={styles.amount}>{formatAmount(state.particles[id], isRare)}</Text>
            <Text style={[styles.rate, rates[id] === 0 && { color: colors.faint }]}>
              {rates[id] > 0 ? `+${formatRate(rates[id])}/s` : '—'}
            </Text>
          </View>
        );
      })}
      {bandRare && !rareRevealed(state, bandRare) && (
        <Text style={styles.tease}>
          A faint signature in the noise… (needs Sensitivity {PARTICLES[bandRare].rare!.revealLevel})
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: space.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  statValue: { color: colors.accent, fontFamily: mono, fontSize: 16, fontWeight: '700' },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  hint: { color: colors.muted, fontSize: 12 },
  dial: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    width: '22%',
    flexGrow: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: space.sm,
    alignItems: 'center',
    gap: 2,
  },
  chipSelected: { borderColor: colors.accent, backgroundColor: '#14283a' },
  chipLocked: { opacity: 0.5 },
  chipBand: { color: colors.text, fontFamily: mono, fontSize: 18, fontWeight: '700' },
  chipSub: { color: colors.muted, fontSize: 11 },
  chipRare: { color: colors.rare, fontSize: 11 },
  warn: { color: colors.warn, fontSize: 12 },
  particleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  symbol: { width: 34, color: colors.accent, fontSize: 15, fontWeight: '700' },
  particleName: { flex: 1, color: colors.text, fontSize: 14 },
  amount: { minWidth: 70, textAlign: 'right', color: colors.text, fontFamily: mono, fontSize: 14 },
  rate: { minWidth: 84, textAlign: 'right', color: colors.good, fontFamily: mono, fontSize: 12 },
  tease: { color: colors.rare, fontSize: 12, fontStyle: 'italic', opacity: 0.8 },
});

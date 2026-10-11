// The Particle Index: every particle found, its level, and its buff.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PARTICLE_IDS, PARTICLES, type BuffKind } from '../data/particles';
import { indexBuffsActive, indexProgress, type GameState } from '../economy';
import { Card, ProgressBar } from './common';
import { formatAmount } from './format';
import { colors, space } from './theme';

const BUFF_LABELS: Record<BuffKind, string> = {
  power: '+{p}% Power',
  yield: '+{p}% Yield',
  rareChance: '+{p}% rare chance',
  wellspring: '+{p}% Wellspring output',
  resonance: '+{p}% Resonance',
  ringSpeedCost: '−{p}% Ring Speed costs',
  beamCurrentCost: '−{p}% Beam Current costs',
  thresholdReq: '−{p}% Threshold Power',
};

function buffText(kind: BuffKind, perLevel: number): string {
  return BUFF_LABELS[kind].replace('{p}', String(Math.round(perLevel * 100))) + ' per level';
}

export function IndexCard({ state }: { state: GameState }) {
  const [open, setOpen] = useState(false);
  const found = PARTICLE_IDS.filter((id) => state.lifetime[id] > 0);
  return (
    <Card
      title="Particle Index"
      right={
        <Pressable onPress={() => setOpen(!open)} hitSlop={12}>
          <Text style={styles.toggle}>
            {found.length}/{PARTICLE_IDS.length} found {open ? '▲' : '▼'}
          </Text>
        </Pressable>
      }
    >
      {open && (
        <>
          {!indexBuffsActive(state) && <Text style={styles.note}>Index buffs switch on after T1.</Text>}
          {found.map((id) => {
            const p = PARTICLES[id];
            const { level, collected, next } = indexProgress(state, id);
            const isRare = p.rare !== undefined;
            return (
              <View key={id} style={styles.entry}>
                <View style={styles.entryHead}>
                  <Text style={[styles.name, isRare && { color: colors.rare }]}>
                    {p.symbol}  {p.name} <Text style={styles.level}>Lv {level}</Text>
                  </Text>
                  <Text style={styles.count}>
                    {formatAmount(collected, isRare)} / {formatAmount(next)}
                  </Text>
                </View>
                <ProgressBar progress={collected / next} color={isRare ? colors.rare : colors.accent} />
                <Text style={styles.buff}>{buffText(p.buff.kind, p.buff.perLevel)} · mass {p.mass}</Text>
              </View>
            );
          })}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  toggle: { color: colors.accent, fontSize: 12 },
  note: { color: colors.warn, fontSize: 12 },
  entry: { gap: 4, paddingVertical: space.xs },
  entryHead: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: colors.text, fontSize: 14, fontWeight: '600' },
  level: { color: colors.muted, fontWeight: '400' },
  count: { color: colors.muted, fontSize: 12 },
  buff: { color: colors.muted, fontSize: 12 },
});

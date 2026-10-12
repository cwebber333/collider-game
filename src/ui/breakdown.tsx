// Where a stat comes from: its base, then each system's multiplier.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  breakdown,
  STAT_NAMES,
  SYSTEM_NAMES,
  type Contribution,
  type GameState,
  type StatId,
} from '../economy';
import { Card } from './common';
import { formatRate } from './format';
import { colors, mono, space } from './theme';

/** Stats the player can inspect. */
const INSPECTABLE: StatId[] = ['power', 'yield', 'chargeRate', 'conduitStrength', 'rareChance'];

function contributionText(c: Contribution): string {
  switch (c.mode) {
    case 'flat':
      return `+${formatRate(c.value)}`;
    case 'add':
      return `+${Math.round(c.value * 100)}%`;
    case 'mult':
      return `×${formatRate(c.value)}`;
  }
}

export function BreakdownCard({ state, stat, onSelect, onClose }: {
  state: GameState;
  stat: StatId;
  onSelect: (stat: StatId) => void;
  onClose: () => void;
}) {
  const b = breakdown(state, stat);
  return (
    <Card
      title={`${STAT_NAMES[stat]}: ${formatRate(b.total)}`}
      right={
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.close}>Close ✕</Text>
        </Pressable>
      }
    >
      <View style={styles.tabs}>
        {INSPECTABLE.map((s) => (
          <Pressable key={s} onPress={() => onSelect(s)} style={[styles.tab, s === stat && styles.tabOn]}>
            <Text style={[styles.tabText, s === stat && { color: colors.accent }]}>{STAT_NAMES[s]}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.rule}>Bonuses add up within a system; systems multiply together.</Text>

      <View style={styles.systemRow}>
        <Text style={styles.systemName}>Base</Text>
        <Text style={styles.factor}>{formatRate(b.base)}</Text>
      </View>
      {b.flat.map((c) => (
        <Text key={c.label} style={styles.detail}>
          {SYSTEM_NAMES[c.system]}: {c.label} {contributionText(c)}
        </Text>
      ))}

      {b.systems.map((s) => (
        <View key={s.system}>
          <View style={styles.systemRow}>
            <Text style={styles.systemName}>{SYSTEM_NAMES[s.system]}</Text>
            <Text style={styles.factor}>×{formatRate(s.factor)}</Text>
          </View>
          {s.contributions.map((c) => (
            <Text key={c.label} style={styles.detail}>
              {c.label} {contributionText(c)}
              {c.mode === 'mult' ? ' (multiplies on its own)' : ''}
            </Text>
          ))}
        </View>
      ))}
      {b.systems.length === 0 && <Text style={styles.detail}>No bonuses yet.</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  close: { color: colors.accent, fontSize: 12 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  tab: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 6, paddingVertical: 3, paddingHorizontal: space.sm },
  tabOn: { borderColor: colors.accent },
  tabText: { color: colors.muted, fontSize: 12 },
  rule: { color: colors.faint, fontSize: 11, fontStyle: 'italic' },
  systemRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs },
  systemName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  factor: { color: colors.accent, fontFamily: mono, fontSize: 14 },
  detail: { color: colors.muted, fontSize: 12, marginLeft: space.md },
});

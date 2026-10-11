// The "while you were away" report and dev-only tools.
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { canAutoPlay, type AutoPlayGoal } from '../bot/autoplay';
import { PARTICLE_IDS, PARTICLES } from '../data/particles';
import { UPGRADES, type UpgradeId } from '../data/upgrades';
import type { GameState } from '../economy';
import type { AwayReport, DevControls } from '../game/useGame';
import { Button, Card } from './common';
import { formatAmount, formatDuration } from './format';
import { colors, mono, space } from './theme';

export function AwayCard({ report, onDismiss }: { report: AwayReport; onDismiss: () => void }) {
  const gained = PARTICLE_IDS.filter((id) => report.gained[id] > 0);
  const capped = report.seconds > report.capSeconds;
  return (
    <Card title="While you were away" style={{ borderColor: colors.accent }}>
      <Text style={styles.body}>
        Away {formatDuration(report.seconds)}
        {capped ? ` (the Ring ran for the first ${formatDuration(report.capSeconds)})` : ''}. Collected:
      </Text>
      <View style={styles.gains}>
        {gained.map((id) => (
          <Text key={id} style={styles.gain}>
            {PARTICLES[id].symbol} +{formatAmount(report.gained[id], PARTICLES[id].rare !== undefined)}
          </Text>
        ))}
      </View>
      <Button label="OK" onPress={onDismiss} />
    </Card>
  );
}

const GOAL_LABELS: Record<AutoPlayGoal, string> = { nextBand: 'next band', nextThreshold: 'next Threshold' };

/** Only rendered in development builds (`__DEV__`). */
export function DevTools({ state, dev }: { state: GameState; dev: DevControls }) {
  const [armed, setArmed] = useState(false);
  const { autoPlay } = dev;
  const busy = autoPlay?.running ?? false;
  const buys = autoPlay
    ? (Object.entries(autoPlay.buys) as [UpgradeId, number][]).map(([id, n]) => `${UPGRADES[id].name} ×${n}`).join(', ')
    : '';
  return (
    <Card title="Dev tools">
      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Free buys</Text>
          <Text style={styles.hint}>Upgrades cost nothing. Turn off to feel the real pace.</Text>
        </View>
        <Switch value={dev.freeBuys} onValueChange={dev.setFreeBuys} trackColor={{ true: colors.warn }} />
      </View>

      <Text style={styles.label}>Auto-play (bot plays from your save)</Text>
      <View style={styles.devRow}>
        {(['nextBand', 'nextThreshold'] as AutoPlayGoal[]).map((goal) => (
          <Button
            key={goal}
            small
            tone="muted"
            label={`To ${GOAL_LABELS[goal]}`}
            disabled={busy || !canAutoPlay(state, goal)}
            onPress={() => dev.runAutoPlay(goal)}
          />
        ))}
      </View>
      {autoPlay && (
        <Text style={styles.hint}>
          {autoPlay.running
            ? `Playing to ${GOAL_LABELS[autoPlay.goal]}… ${formatDuration(autoPlay.seconds)} of game time`
            : `${autoPlay.gaveUp ? 'Gave up after' : `Reached ${GOAL_LABELS[autoPlay.goal]} in`} ${formatDuration(autoPlay.seconds)} of game time.` +
              (buys ? ` Bought: ${buys}.` : '')}
        </Text>
      )}

      <Text style={styles.label}>Skip time</Text>
      <View style={styles.devRow}>
        <Button small tone="muted" label="+10m" disabled={busy} onPress={() => dev.skipTime(600)} />
        <Button small tone="muted" label="+1h" disabled={busy} onPress={() => dev.skipTime(3600)} />
        <Button small tone="muted" label="+8h" disabled={busy} onPress={() => dev.skipTime(8 * 3600)} />
        <Button
          small
          tone="warn"
          label={armed ? 'Really reset?' : 'Reset save'}
          disabled={busy}
          onPress={() => {
            if (!armed) return setArmed(true);
            setArmed(false);
            dev.resetGame();
          }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.text, fontSize: 13 },
  gains: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  gain: { color: colors.good, fontFamily: mono, fontSize: 13 },
  devRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  label: { color: colors.text, fontSize: 13, fontWeight: '600' },
  hint: { color: colors.muted, fontSize: 12 },
});

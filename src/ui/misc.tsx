// The "while you were away" report and dev-only tools.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OFFLINE_CAP_SECONDS } from '../data/constants';
import { PARTICLE_IDS, PARTICLES } from '../data/particles';
import type { AwayReport } from '../game/useGame';
import { Button, Card } from './common';
import { formatAmount, formatDuration } from './format';
import { colors, mono, space } from './theme';

export function AwayCard({ report, onDismiss }: { report: AwayReport; onDismiss: () => void }) {
  const gained = PARTICLE_IDS.filter((id) => report.gained[id] > 0);
  const capped = report.seconds > OFFLINE_CAP_SECONDS;
  return (
    <Card title="While you were away" style={{ borderColor: colors.accent }}>
      <Text style={styles.body}>
        Away {formatDuration(report.seconds)}
        {capped ? ` (the Ring ran for the first ${formatDuration(OFFLINE_CAP_SECONDS)})` : ''}. Collected:
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

/** Only rendered in development builds (`__DEV__`). */
export function DevTools({ skipTime, resetGame }: { skipTime: (s: number) => void; resetGame: () => void }) {
  const [armed, setArmed] = useState(false);
  return (
    <Card title="Dev tools">
      <View style={styles.devRow}>
        <Button small tone="muted" label="+10m" onPress={() => skipTime(600)} />
        <Button small tone="muted" label="+1h" onPress={() => skipTime(3600)} />
        <Button small tone="muted" label="+8h" onPress={() => skipTime(8 * 3600)} />
        <Button
          small
          tone="warn"
          label={armed ? 'Really reset?' : 'Reset save'}
          onPress={() => {
            if (!armed) return setArmed(true);
            setArmed(false);
            resetGame();
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
});

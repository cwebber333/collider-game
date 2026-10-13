// The Stations hub: one tile per side system, locked until its Threshold.
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLoadedGame } from '../../game/GameProvider';
import { Screen } from '../../ui/layout';
import { isOpen, STATIONS, stationReady, unlockText } from '../../ui/navigation';
import { colors, space } from '../../ui/theme';

export default function StationsHub() {
  const { state } = useLoadedGame();
  return (
    <Screen>
      <Text style={styles.heading}>Stations</Text>
      <View style={styles.grid}>
        {STATIONS.map((s) => {
          const open = isOpen(state, s.feature);
          return (
            <Pressable
              key={s.id}
              disabled={!open}
              onPress={() => router.push(`/stations/${s.id}`)}
              style={({ pressed }) => [styles.tile, !open && styles.tileLocked, pressed && { opacity: 0.7 }]}
            >
              <Text style={[styles.name, !open && { color: colors.faint }]}>{s.name}</Text>
              <Text style={[styles.blurb, !open && { color: colors.warn }]}>{open ? s.blurb : `🔒 ${unlockText(s.feature)}`}</Text>
              {stationReady(state, s) && <View style={styles.badge} />}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    width: '48%',
    flexGrow: 1,
    minHeight: 84,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: space.md,
    gap: space.xs,
    justifyContent: 'center',
  },
  tileLocked: { opacity: 0.6 },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  blurb: { color: colors.muted, fontSize: 12 },
  badge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warn },
});

// The Menu: every system as a tile, grouped like IOM's menu
// (what survives a Recalibrate, what doesn't, and the rest).
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLoadedGame } from '../../game/GameProvider';
import { Screen } from '../../ui/layout';
import { isOpen, MENU_GROUPS, unlockText } from '../../ui/navigation';
import { colors, space } from '../../ui/theme';

export default function MenuScreen() {
  const { state } = useLoadedGame();
  return (
    <Screen>
      {MENU_GROUPS.map((group) => (
        <View key={group.title} style={{ gap: space.sm }}>
          <Text style={styles.heading}>{group.title}</Text>
          <View style={styles.grid}>
            {group.items
              .filter((item) => !item.devOnly || __DEV__)
              .map((item) => {
                const open = isOpen(state, item.feature);
                return (
                  <Pressable
                    key={item.label}
                    disabled={!open}
                    onPress={() => router.navigate(item.href as Href)}
                    style={({ pressed }) => [styles.tile, !open && styles.tileLocked, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={[styles.label, !open && { color: colors.faint }]} numberOfLines={2}>
                      {item.label}
                    </Text>
                    {!open && item.feature && <Text style={styles.locked}>🔒 {unlockText(item.feature).replace('Unlocks at ', '')}</Text>}
                    {open && item.badge?.(state) && <View style={styles.badge} />}
                  </Pressable>
                );
              })}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tileLocked: { opacity: 0.6 },
  label: { color: colors.text, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  locked: { color: colors.warn, fontSize: 11 },
  badge: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warn },
});

// The frame around every screen: the top bar, the collider strip (always
// visible), the current tab, the bottom tab bar, and pop-ups.
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { THRESHOLDS } from '../data/thresholds';
import {
  bandCap,
  bandEfficiency,
  canBreach,
  hasFeature,
  nextThreshold,
  particleYield,
  power,
  thresholdPowerRequired,
  type GameState,
  type StatId,
} from '../economy';
import { useLoadedGame } from '../game/GameProvider';
import { BreakdownCard } from './breakdown';
import { Button, Card, ProgressBar } from './common';
import { formatAmount, formatPercent, formatRate } from './format';
import { Overlay } from './layout';
import { AwayCard } from './misc';
import { FEATURE_PLACES, isOpen, TABS } from './navigation';
import { rewardText } from './progress';
import { colors, mono, space } from './theme';

export function Shell() {
  const { state, dispatch, away, dismissAway, dev } = useLoadedGame();
  // Which stat's breakdown pop-up is open (null = none).
  const [inspecting, setInspecting] = useState<StatId | null>(null);

  // Breaches the player has already seen. A new breach (or several, after
  // time away or auto-breach) shows a pop-up until dismissed.
  const [seenBreached, setSeenBreached] = useState(state.breached);
  // A save reset lowers the count; follow it down. (Setting state while
  // rendering is React's way to adjust state to a changed input.)
  if (state.breached < seenBreached) setSeenBreached(state.breached);
  const newBreaches = state.breached > seenBreached && !away ? { from: seenBreached + 1, to: state.breached } : null;

  return (
    <Tabs style={styles.shell}>
      <TopBar state={state} freeBuys={dev.freeBuys} />
      <ColliderStrip state={state} onInspect={setInspecting} onBreach={() => dispatch({ type: 'breach' })} onBand={(band) => dispatch({ type: 'selectBand', band })} />
      <TabSlot style={styles.slot} />
      <TabList style={styles.tabBar}>
        {TABS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} resetOnFocus={tab.resetOnFocus} asChild>
            <TabButton
              label={tab.label}
              icon={tab.icon}
              dim={!isOpen(state, tab.feature)}
              badge={isOpen(state, tab.feature) && (tab.badge?.(state) ?? false)}
            />
          </TabTrigger>
        ))}
      </TabList>

      <Overlay visible={away !== null} onClose={dismissAway}>
        {away && <AwayCard report={away} onDismiss={dismissAway} />}
      </Overlay>
      <Overlay visible={inspecting !== null} onClose={() => setInspecting(null)}>
        {inspecting && (
          <BreakdownCard state={state} stat={inspecting} onSelect={setInspecting} onClose={() => setInspecting(null)} />
        )}
      </Overlay>
      <Overlay visible={newBreaches !== null} onClose={() => setSeenBreached(state.breached)}>
        {newBreaches && (
          <BreachCard from={newBreaches.from} to={newBreaches.to} onDismiss={() => setSeenBreached(state.breached)} />
        )}
      </Overlay>
    </Tabs>
  );
}

function TopBar({ state, freeBuys }: { state: GameState; freeBuys: boolean }) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.title}>THE LOST RING</Text>
      {freeBuys && <Text style={styles.devFlag}>FREE BUYS</Text>}
      <View style={styles.currencies}>
        {hasFeature(state, 'wellspring') && <Text style={styles.charge}>⚡ {formatAmount(state.charge)}</Text>}
        <Text style={styles.crystals}>◆ {state.crystals}</Text>
      </View>
    </View>
  );
}

/** Always on screen: how the Ring is running and how close the next Threshold is. */
function ColliderStrip({ state, onInspect, onBreach, onBand }: {
  state: GameState;
  onInspect: (stat: StatId) => void;
  onBreach: () => void;
  onBand: (band: number) => void;
}) {
  const band = state.selectedBand;
  const efficiency = bandEfficiency(state, band);
  const t = nextThreshold(state);
  return (
    <View style={styles.strip}>
      <View style={styles.stripRow}>
        <Pressable onPress={() => onInspect('power')} style={({ pressed }) => [styles.stat, pressed && styles.pressed]}>
          <Text style={styles.statValue}>{formatRate(power(state))}</Text>
          <Text style={styles.statLabel}>Power ⓘ</Text>
        </Pressable>
        <Pressable onPress={() => onInspect('yield')} style={({ pressed }) => [styles.stat, pressed && styles.pressed]}>
          <Text style={styles.statValue}>{formatRate(particleYield(state))}</Text>
          <Text style={styles.statLabel}>Yield ⓘ</Text>
        </Pressable>
        <View style={styles.bandPicker}>
          <Pressable hitSlop={8} disabled={band <= 1} onPress={() => onBand(band - 1)} style={styles.arrow}>
            <Text style={[styles.arrowText, band <= 1 && { color: colors.faint }]}>‹</Text>
          </Pressable>
          <View style={styles.bandMiddle}>
            <Text style={styles.statValue}>Band {band}</Text>
            <Text style={[styles.statLabel, efficiency < 1 && { color: colors.warn }]}>
              {efficiency < 1 ? `${formatPercent(efficiency)} energy` : 'stable'}
            </Text>
          </View>
          <Pressable hitSlop={8} disabled={band >= bandCap(state)} onPress={() => onBand(band + 1)} style={styles.arrow}>
            <Text style={[styles.arrowText, band >= bandCap(state) && { color: colors.faint }]}>›</Text>
          </Pressable>
        </View>
      </View>

      {t ? (
        <View style={styles.thresholdRow}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.thresholdText} numberOfLines={1}>
              T{state.breached + 1} · {rewardText(t.reward)}
            </Text>
            <ProgressBar progress={power(state) / thresholdPowerRequired(state, t)} color={canBreach(state) ? colors.good : colors.accent} />
          </View>
          {canBreach(state) ? (
            <Button small label="Breach" onPress={onBreach} />
          ) : (
            <Text style={styles.percent}>{formatPercent(Math.min(1, power(state) / thresholdPowerRequired(state, t)))}</Text>
          )}
        </View>
      ) : (
        <Text style={styles.thresholdText}>Every Inner Ring Threshold is breached.</Text>
      )}
    </View>
  );
}

/** Thresholds `from`..`to` (1-based) were just breached. */
function BreachCard({ from, to, onDismiss }: { from: number; to: number; onDismiss: () => void }) {
  const breached = THRESHOLDS.slice(from - 1, to);
  const last = breached[breached.length - 1];
  return (
    <Card title={from === to ? `Threshold T${to} breached` : `Thresholds T${from}–T${to} breached`} style={{ borderColor: colors.good }}>
      {breached.map((t, i) => {
        const feature = t.reward.kind === 'bonus' ? undefined : t.reward.feature;
        const place = feature && FEATURE_PLACES[feature];
        return (
          <View key={i} style={{ gap: 2 }}>
            <Text style={styles.breachReward}>
              T{from + i}: {rewardText(t.reward)} <Text style={styles.crystals}>+{t.crystals} ◆</Text>
            </Text>
            {place && <Text style={styles.breachPlace}>Find it in {place}.</Text>}
          </View>
        );
      })}
      <Text style={styles.lore}>“{last.lore}”</Text>
      <Button label="Continue" onPress={onDismiss} />
    </Card>
  );
}

type TabButtonProps = TabTriggerSlotProps & { label: string; icon: string; dim: boolean; badge: boolean };

/** One bottom-bar button. TabTrigger passes `isFocused` and `onPress` in. */
function TabButton({ label, icon, dim, badge, isFocused, ...props }: TabButtonProps) {
  return (
    <Pressable {...props} style={[styles.tab, isFocused && styles.tabFocused]}>
      <Text style={[styles.tabIcon, isFocused && { color: colors.accent }, dim && { color: colors.faint }]}>{icon}</Text>
      <Text style={[styles.tabLabel, isFocused && { color: colors.accent }, dim && { color: colors.faint }]} numberOfLines={1}>
        {dim ? `🔒 ${label}` : label}
      </Text>
      {badge && !isFocused && <View style={styles.badge} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  slot: { flex: 1 },
  pressed: { opacity: 0.7 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: space.sm,
  },
  title: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 4 },
  devFlag: { color: colors.warn, fontSize: 10, fontWeight: '700' },
  currencies: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: space.md },
  charge: { color: colors.warn, fontFamily: mono, fontSize: 14, fontWeight: '700' },
  crystals: { color: colors.rare, fontSize: 14, fontWeight: '700' },
  strip: {
    marginHorizontal: space.md,
    padding: space.sm,
    gap: space.sm,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 10,
  },
  stripRow: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  statValue: { color: colors.accent, fontFamily: mono, fontSize: 15, fontWeight: '700' },
  statLabel: { color: colors.muted, fontSize: 11 },
  bandPicker: { flex: 1.4, flexDirection: 'row', alignItems: 'center' },
  bandMiddle: { flex: 1, alignItems: 'center' },
  arrow: { paddingHorizontal: space.sm },
  arrowText: { color: colors.accent, fontSize: 24, fontWeight: '700' },
  thresholdRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  thresholdText: { color: colors.text, fontSize: 12 },
  percent: { color: colors.muted, fontFamily: mono, fontSize: 12, minWidth: 40, textAlign: 'right' },
  breachReward: { color: colors.text, fontSize: 14, fontWeight: '700' },
  breachPlace: { color: colors.muted, fontSize: 12 },
  lore: { color: colors.text, fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: space.sm, gap: 2 },
  tabFocused: { backgroundColor: '#14283a' },
  tabIcon: { color: colors.muted, fontSize: 18 },
  tabLabel: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: 6,
    right: '28%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warn,
  },
});

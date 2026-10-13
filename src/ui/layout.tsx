// Screen-level building blocks: a scrolling page, a back header for
// sub-pages, a locked placeholder, and a pop-up panel.
import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { FeatureId } from '../data/features';
import { Card } from './common';
import { unlockText } from './navigation';
import { colors, space } from './theme';

/** The scrolling area of a tab or sub-page. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {children}
    </ScrollView>
  );
}

/**
 * "‹ Back  Title" for pages opened from a hub. Back always returns to the
 * `parent` hub (plain history would hop between tabs instead).
 */
export function SubHeader({ title, parent }: { title: string; parent: Href }) {
  return (
    <View style={styles.subHeader}>
      <Pressable
        hitSlop={12}
        onPress={() => router.navigate(parent)}
        style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
      >
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>
      <Text style={styles.subTitle}>{title}</Text>
    </View>
  );
}

/** Placeholder for a whole screen that a Threshold hasn't opened yet. */
export function LockedPanel({ title, feature, tease }: { title: string; feature: FeatureId; tease: string }) {
  return (
    <Card title={title}>
      <Text style={styles.locked}>🔒 {unlockText(feature)}</Text>
      <Text style={styles.tease}>{tease}</Text>
    </Card>
  );
}

/** A centered pop-up over the game. Tapping outside closes it. */
export function Overlay({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* An inner Pressable swallows taps so they don't reach the backdrop. */}
        <Pressable style={styles.panel} onPress={() => {}}>
          <ScrollView contentContainerStyle={styles.panelContent}>{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: space.md, gap: space.md, paddingBottom: space.xl },
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  back: { paddingVertical: space.xs, paddingRight: space.sm },
  backText: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  subTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  locked: { color: colors.warn, fontSize: 14, fontWeight: '700' },
  tease: { color: colors.muted, fontSize: 13, fontStyle: 'italic' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  panel: { width: '100%', maxWidth: 420, maxHeight: '85%' },
  panelContent: { gap: space.md },
});

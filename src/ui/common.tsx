// Small shared building blocks.
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, space } from './theme';

export function Card({ title, right, children, style }: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.card, style]}>
      {(title || right) && (
        <View style={styles.cardHeader}>
          {title && <Text style={styles.cardTitle}>{title}</Text>}
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

export function Button({ label, onPress, disabled, tone = 'accent', small }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'accent' | 'warn' | 'muted';
  small?: boolean;
}) {
  const background = { accent: colors.accent, warn: colors.warn, muted: colors.cardBorder }[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: disabled ? colors.cardBorder : background, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, disabled && { color: colors.faint }, tone === 'muted' && { color: colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A thin bar filled to `progress` (0–1). */
export function ProgressBar({ progress, color = colors.accent }: { progress: number; color?: string }) {
  const width = `${Math.max(0, Math.min(1, progress)) * 100}%` as const;
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: space.md,
    gap: space.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  button: { borderRadius: 8, paddingVertical: space.sm, paddingHorizontal: space.md, alignItems: 'center' },
  buttonSmall: { paddingVertical: 6, paddingHorizontal: space.sm },
  buttonText: { color: colors.buttonText, fontWeight: '700', fontSize: 14 },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.cardBorder, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
});

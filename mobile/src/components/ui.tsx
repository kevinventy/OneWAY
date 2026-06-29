import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, tones, type ToneKey } from '@/theme';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'accent' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const v = BTN[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.btn, v.box, (disabled || loading) && { opacity: 0.5 }, pressed && { opacity: 0.85 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={v.text.color} />}
          <Text style={[styles.btnText, v.text]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const BTN = {
  primary: { box: { backgroundColor: colors.brand600 }, text: { color: colors.white } },
  accent: { box: { backgroundColor: colors.amber500 }, text: { color: colors.ink } },
  outline: { box: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }, text: { color: colors.inkSoft } },
  ghost: { box: { backgroundColor: 'transparent' }, text: { color: colors.inkSoft } },
} as const;

export function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: ToneKey }) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

export function Avatar({ name, color = colors.brand600, size = 40 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={{ color: colors.white, fontWeight: '800', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.inkMuted} {...props} style={[styles.input, props.style]} />;
}

export function Stat({ label, value, tone = 'blue' }: { label: string; value: string | number; tone?: ToneKey }) {
  return (
    <Card style={{ flex: 1, padding: 12 }}>
      <Text style={{ color: colors.inkMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.ink, fontSize: 22, fontWeight: '800', marginTop: 4 }}>{value}</Text>
    </Card>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={{ fontSize: 16, fontWeight: '800', color: colors.ink }}>{children}</Text>
      {right}
    </View>
  );
}

export function EmptyState({ icon = 'cube-outline', title, description }: { icon?: keyof typeof Ionicons.glyphMap; title: string; description?: string }) {
  return (
    <Card style={{ alignItems: 'center', padding: 28 }}>
      <Ionicons name={icon} size={36} color={colors.brand500} />
      <Text style={{ fontWeight: '700', color: colors.ink, marginTop: 8, textAlign: 'center' }}>{title}</Text>
      {description && <Text style={{ color: colors.inkMuted, textAlign: 'center', marginTop: 4 }}>{description}</Text>}
    </Card>
  );
}

export function Stars({ value, count }: { value: number; count?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Ionicons name="star" size={13} color={colors.amber500} />
      <Text style={{ fontWeight: '700', color: colors.ink }}>{value > 0 ? value.toFixed(1) : '—'}</Text>
      {count != null && <Text style={{ color: colors.inkMuted, fontSize: 12 }}>({count})</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, ...shadow },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 16 },
  btnText: { fontWeight: '700', fontSize: 15 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.inkSoft, fontWeight: '600', fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.ink },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 6 },
});

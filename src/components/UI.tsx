import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ComponentProps, PropsWithChildren } from 'react';
import { colors, serif, ui } from '../theme';
import { useWorkspace } from '../state/Workspace';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export function Icon({
  name,
  color = colors.cyan,
  size = 22,
}: {
  name: IconName;
  color?: ColorValue;
  size?: number;
}) {
  return <Ionicons name={name} color={color} size={size} />;
}
export function Action({
  children,
  onPress,
  label,
  style,
  disabled = false,
}: PropsWithChildren<{
  onPress: () => void;
  label: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        style,
        pressed && { opacity: 0.65 },
        disabled && { opacity: 0.45 },
      ]}
    >
      {children}
    </Pressable>
  );
}
export function Screen({
  title,
  subtitle,
  eyebrow = 'PANEL ORGANIZATORA',
  back = false,
  children,
}: PropsWithChildren<{ title: string; subtitle: string; eyebrow?: string; back?: boolean }>) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[ui.between, { marginBottom: 14 }]}>
            <View style={ui.row}>
              <View style={styles.logo}>
                <View style={styles.diamond} />
              </View>
              <Text style={styles.brand}>EVENTFLOW</Text>
            </View>
            <View style={[ui.row, { gap: 6 }]}>
              <View style={styles.dot} />
              <Text style={{ color: colors.green, fontSize: 10, letterSpacing: 0.5 }}>
                BAZA DANYCH
              </Text>
            </View>
          </View>
          <View style={ui.row}>
            {back && (
              <Action
                label="Wróć"
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
                style={styles.back}
              >
                <Icon name="chevron-back" />
              </Action>
            )}
            <View style={ui.grow}>
              <Text style={styles.eyebrow}>{eyebrow}</Text>
              <Text accessibilityRole="header" style={styles.heading}>
                {title}
              </Text>
              <Text style={ui.muted}>{subtitle}</Text>
            </View>
          </View>
        </View>
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </View>
  );
}
export function Section({
  number,
  title,
  action,
  onPress,
}: {
  number: string;
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={[ui.between, { marginTop: 17, marginBottom: 12 }]}>
      <View style={[ui.row, ui.grow, { gap: 7 }]}>
        <Text style={{ color: colors.cyan, fontFamily: serif, fontSize: 22 }}>{number}</Text>
        <Text accessibilityRole="header" style={[ui.text, { fontSize: 16, flexShrink: 1 }]}>
          {title}
        </Text>
      </View>
      {action && onPress && (
        <Action label={action} onPress={onPress}>
          <Text style={[ui.small, ui.cyan]}>{action}</Text>
        </Action>
      )}
    </View>
  );
}
export function Badge({
  children,
  color = colors.green,
  background = colors.greenBg,
}: PropsWithChildren<{ color?: string; background?: string }>) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: 30,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: background,
      }}
    >
      <Text style={{ color, fontSize: 10, lineHeight: 14 }}>{children}</Text>
    </View>
  );
}
export function PrimaryButton({
  title,
  icon,
  onPress,
  disabled = false,
}: {
  title: string;
  icon: IconName;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Action label={title} onPress={onPress} disabled={disabled} style={styles.primary}>
      <Icon name={icon} color={colors.bg} />
      <Text style={{ color: colors.bg, fontSize: 13, fontWeight: '600', flexShrink: 1 }}>
        {title}
      </Text>
    </Action>
  );
}
export function Sheet({
  title,
  visible,
  onClose,
  children,
}: PropsWithChildren<{ title: string; visible: boolean; onClose: () => void }>) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modal}>
        <Pressable
          accessibilityLabel="Zamknij okno"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
        >
          <View style={[ui.between, { marginBottom: 12 }]}>
            <Text accessibilityRole="header" style={[ui.title, ui.grow, { fontSize: 25 }]}>
              {title}
            </Text>
            <Action label="Zamknij" onPress={onClose}>
              <Icon name="close" />
            </Action>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export function Empty({
  title,
  text,
  onPress,
  button = 'Przejdź do wydarzeń',
}: {
  title: string;
  text: string;
  onPress: () => void;
  button?: string;
}) {
  return (
    <View style={[ui.card, { alignItems: 'center', paddingVertical: 30, gap: 12 }]}>
      <Icon name="bookmark-outline" size={32} />
      <Text style={ui.title}>{title}</Text>
      <Text style={[ui.small, { textAlign: 'center' }]}>{text}</Text>
      <PrimaryButton title={button} icon="calendar-outline" onPress={onPress} />
    </View>
  );
}
export function Toast() {
  const { message, dismiss } = useWorkspace();
  const insets = useSafeAreaInsets();
  if (!message) return null;
  return (
    <View style={[styles.toastContainer, { bottom: 88 + insets.bottom }]}>
      <Action label="Zamknij komunikat" onPress={dismiss} style={styles.toast}>
        <Text accessibilityLiveRegion="polite" style={[ui.small, ui.grow, { color: colors.text }]}>
          {message}
        </Text>
        <Icon name="close" size={18} />
      </Action>
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flexGrow: 1, width: '100%', maxWidth: 600, alignSelf: 'center', paddingBottom: 24 },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  logo: {
    width: 29,
    height: 29,
    backgroundColor: colors.teal,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamond: {
    width: 11,
    height: 11,
    borderColor: colors.cyan,
    borderWidth: 2,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  brand: { color: colors.text, fontSize: 16, letterSpacing: 0.7 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  eyebrow: { color: colors.cyan, fontSize: 10, lineHeight: 15, marginBottom: 2 },
  heading: { color: colors.text, fontFamily: serif, fontSize: 25, lineHeight: 30 },
  content: { padding: 18, paddingTop: 14 },
  action: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  back: { backgroundColor: colors.raised, borderRadius: 10, alignItems: 'center' },
  primary: {
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.cyan,
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  bookmark: { width: 38, minWidth: 44, height: 44, borderRadius: 12, alignItems: 'center' },
  modal: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    maxWidth: 600,
    maxHeight: '85%',
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: 14,
    padding: 15,
    width: '100%',
    maxWidth: 550,
  },
});

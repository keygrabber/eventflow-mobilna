import { Platform, StyleSheet } from 'react-native';

export const colors = {
  bg: '#090f13',
  card: '#141d23',
  raised: '#202930',
  border: '#30404b',
  text: '#f5f3ec',
  secondary: '#b2bdc5',
  muted: '#82919d',
  cyan: '#50cbed',
  teal: '#123a49',
  green: '#4dd7a1',
  greenBg: '#143b31',
  amber: '#ffbd40',
  amberBg: '#46371f',
  red: '#ff616b',
  redBg: '#4a242b',
};
export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
export const ui = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  grow: { flex: 1, minWidth: 0 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 14 },
  text: { color: colors.text, fontSize: 15, lineHeight: 21 },
  small: { color: colors.secondary, fontSize: 12, lineHeight: 17 },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  title: { color: colors.text, fontFamily: serif, fontSize: 27, lineHeight: 33 },
  cyan: { color: colors.cyan },
  divider: { height: 1, backgroundColor: colors.border },
});

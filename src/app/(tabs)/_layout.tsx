import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '../../components/UI';
import { colors } from '../../theme';

const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Przegląd', icon: 'home-outline' },
  { name: 'map', title: 'Strefy', icon: 'map-outline' },
  { name: 'events', title: 'Eventy', icon: 'calendar-outline' },
  { name: 'alerts', title: 'Alerty', icon: 'warning-outline' },
  { name: 'account', title: 'Konto', icon: 'person-outline' },
];
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      backBehavior="history"
      tabBar={({ state, navigation }) => (
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderColor: colors.border,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 8),
            paddingHorizontal: 6,
            gap: 3,
          }}
        >
          {state.routes.map((route, index) => {
            const tab = tabs.find((item) => item.name === route.name)!;
            const selected = state.index === index;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityLabel={tab.title}
                accessibilityState={{ selected }}
                aria-selected={selected}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                }}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 52,
                  paddingVertical: 8,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  backgroundColor: selected ? colors.teal : 'transparent',
                  opacity: pressed ? 0.65 : 1,
                })}
              >
                <Icon name={tab.icon} size={22} color={selected ? colors.cyan : colors.muted} />
                <Text style={{ color: selected ? colors.text : colors.muted, fontSize: 10 }}>
                  {tab.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
          }}
        />
      ))}
    </Tabs>
  );
}

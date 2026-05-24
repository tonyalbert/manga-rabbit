import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type MenuItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: string | null;
  soon?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { label: "Início",     icon: "home-outline",     screen: "HomeMain" },
  { label: "Favoritos",  icon: "heart-outline",     screen: "Favoritos" },
  { label: "Downloads",  icon: "download-outline",  screen: null, soon: true },
];

export const AppDrawer = ({ navigation }: DrawerContentComponentProps) => {
  const insets = useSafeAreaInsets();
  const rootNav = navigation.getParent();

  const handlePress = (item: MenuItem) => {
    if (item.soon || !item.screen) return;
    navigation.closeDrawer();
    if (item.screen === "HomeMain") return;
    rootNav?.navigate(item.screen as never);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>

      {/* Logo */}
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Ionicons name="book" size={28} color="#EB5757" />
        </View>
        <Text style={styles.appName}>MangaRabbit</Text>
        <Text style={styles.appSub}>Seu leitor de manga</Text>
      </View>

      <View style={styles.divider} />

      {/* Itens */}
      <View style={styles.menu}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.item, item.soon && styles.itemDisabled]}
            onPress={() => handlePress(item)}
            activeOpacity={item.soon ? 1 : 0.7}
          >
            <View style={styles.itemIcon}>
              <Ionicons
                name={item.icon}
                size={22}
                color={item.soon ? "#333" : "#aaa"}
              />
            </View>
            <Text style={[styles.itemLabel, item.soon && styles.itemLabelDisabled]}>
              {item.label}
            </Text>
            {item.soon && (
              <View style={styles.soonBadge}>
                <Text style={styles.soonText}>Em breve</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Rodapé */}
      <View style={styles.footer}>
        <Text style={styles.version}>MangaRabbit v2.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C1E",
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  appName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  appSub: {
    fontSize: 13,
    color: "#555",
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: "#2C2C2E",
    marginHorizontal: 16,
    marginBottom: 12,
  },

  menu: { flex: 1, paddingHorizontal: 12 },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  itemDisabled: { opacity: 0.5 },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  itemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#ccc",
  },
  itemLabelDisabled: { color: "#444" },

  soonBadge: {
    backgroundColor: "#2C2C2E",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  soonText: { fontSize: 10, color: "#555", fontWeight: "700" },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#2C2C2E",
  },
  version: { fontSize: 12, color: "#333" },
});

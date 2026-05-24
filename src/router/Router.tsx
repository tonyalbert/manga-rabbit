import { useEffect, useState } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Home } from "../pages/Home";
import { MangaPage } from "../pages/Manga";
import { MangaPages } from "../pages/MangaPages";
import { LikedMangas } from "../pages/LikedMangas";
import { Onboarding } from "../pages/Onboarding";
import { AppDrawer } from "../components/AppDrawer";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#0F0F0F",
    card: "#1C1C1E",
    text: "#FFFFFF",
    border: "#38383A",
  },
};

const HomeDrawer = () => (
  <Drawer.Navigator
    drawerContent={(props) => <AppDrawer {...props} />}
    screenOptions={{
      headerShown: false,
      drawerStyle: { width: 280, backgroundColor: "#1C1C1E" },
      drawerType: "slide",
      overlayColor: "rgba(0,0,0,0.6)",
      swipeEdgeWidth: 40,
    }}
  >
    <Drawer.Screen name="HomeMain" component={Home} />
  </Drawer.Navigator>
);

export const Router = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("onboarding_done").then((val) => {
      setInitialRoute(val ? "HomeDrawer" : "Onboarding");
    });
  }, []);

  // Aguarda verificação do AsyncStorage antes de montar o navigator
  if (!initialRoute) return null;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0F0F0F" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="HomeDrawer" component={HomeDrawer} />
        <Stack.Screen name="Manga" component={MangaPage} />
        <Stack.Screen name="Chapter" component={MangaPages} />
        <Stack.Screen name="Favoritos" component={LikedMangas} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

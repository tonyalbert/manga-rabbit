import { StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider, MD3DarkTheme } from "react-native-paper";
import { Router } from "./src/router/Router";

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#EB5757",
    secondary: "#EB5757",
    background: "#0F0F0F",
    surface: "#1C1C1E",
    surfaceVariant: "#2C2C2E",
    onBackground: "#FFFFFF",
    onSurface: "#FFFFFF",
    outline: "#38383A",
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <PaperProvider theme={theme}>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <Router />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F0F0F" },
});

// ============================================================
// Root Layout (_layout.tsx)
//
// Bootstraps the app: loads fonts, hydrates auth state,
// and wraps all routes in PaperProvider (Material Design 3).
// ============================================================
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";
import { useAuthStore } from "@/store/authStore";
import { AppTheme } from "@/theme";

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    hydrate();
  }, []);

  if (!isHydrated) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={AppTheme}>
          <View style={{ flex: 1, backgroundColor: "#0D0D0F", justifyContent: "center", alignItems: "center" }}>
            <StatusBar style="light" backgroundColor="#0D0D0F" />
            <ActivityIndicator size="large" color="#BB86FC" />
          </View>
        </PaperProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={AppTheme}>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor="#0D0D0F" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#0D0D0F" },
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </SafeAreaProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

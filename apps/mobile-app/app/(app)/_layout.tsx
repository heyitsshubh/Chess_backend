// ============================================================
// App Group Layout (Protected)
//
// Redirects to login if not authenticated.
// Initializes the socket connection once.
// ============================================================
import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useSocket } from "@/hooks/useSocket";

export default function AppLayout() {
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // Initialize socket connection for the entire authenticated session
  useSocket();

  if (!isHydrated) return null;
  if (!token) return <Redirect href="/(auth)/login" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0D0D0F" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="game" options={{ animation: "slide_from_bottom" }} />
    </Stack>
  );
}

// ============================================================
// Home / Lobby Screen
//
// Shows user stats, ELO, and time control selection.
// Entry point for matchmaking.
// ============================================================
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientButton } from "@/components/ui/GradientButton";
import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";
import { useSocket } from "@/hooks/useSocket";

const TIME_CONTROLS = [
  { label: "1 min", value: "1|0", icon: "⚡", tag: "Bullet" },
  { label: "3 min", value: "3|0", icon: "🔥", tag: "Blitz" },
  { label: "5 min", value: "5|0", icon: "⏱", tag: "Blitz" },
  { label: "10 min", value: "10|0", icon: "♟", tag: "Rapid" },
];

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const status = useGameStore((s) => s.status);
  const game = useGameStore((s) => s.game);
  const { joinQueue, leaveQueue } = useSocket();

  const [selectedTimeControl, setSelectedTimeControl] = useState("3|0");

  const handleFindGame = () => {
    useGameStore.getState().setSearching();
    joinQueue(selectedTimeControl);
  };

  const handleCancel = () => {
    leaveQueue();
  };

  // Navigate to game screen when match is found
  React.useEffect(() => {
    if (status === "playing" && game) {
      router.push("/(app)/game");
    }
  }, [status, game]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D0F" }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Top Bar */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <View>
            <Text style={{ color: "#9CA3AF", fontSize: 13 }}>Welcome back</Text>
            <Text style={{ color: "#F8F8FF", fontSize: 22, fontWeight: "800" }}>
              {user?.username ?? "—"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={logout}
            style={{
              backgroundColor: "#1C1C22",
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: "#2A2A35",
            }}
          >
            <Text style={{ color: "#9CA3AF", fontSize: 13, fontWeight: "600" }}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <LinearGradient
          colors={["#1C1524", "#16161A"]}
          style={{
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "#7B61FF33",
          }}
        >
          <Text
            style={{
              color: "#9CA3AF",
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Your Rating
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              gap: 6,
              marginTop: 8,
            }}
          >
            <Text style={{ color: "#7B61FF", fontSize: 52, fontWeight: "900" }}>
              1200
            </Text>
            <Text style={{ color: "#9CA3AF", fontSize: 16 }}>ELO</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 20, marginTop: 16 }}>
            {[
              ["W", "0", "#22C55E"],
              ["D", "0", "#F59E0B"],
              ["L", "0", "#EF4444"],
            ].map(([label, val, color]) => (
              <View key={label}>
                <Text
                  style={{ color: "#6B7280", fontSize: 11, fontWeight: "600" }}
                >
                  {label}
                </Text>
                <Text
                  style={{
                    color: color as string,
                    fontSize: 20,
                    fontWeight: "800",
                  }}
                >
                  {val}
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Time Control Selection */}
        <Text
          style={{
            color: "#F8F8FF",
            fontSize: 18,
            fontWeight: "700",
            marginBottom: 14,
          }}
        >
          Choose Time Control
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 28,
          }}
        >
          {TIME_CONTROLS.map((tc) => {
            const isSelected = selectedTimeControl === tc.value;
            return (
              <TouchableOpacity
                key={tc.value}
                onPress={() => setSelectedTimeControl(tc.value)}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  minWidth: "45%",
                  backgroundColor: isSelected ? "#1C1524" : "#16161A",
                  borderRadius: 16,
                  padding: 16,
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: isSelected ? "#7B61FF" : "#2A2A35",
                }}
              >
                <Text style={{ fontSize: 28, marginBottom: 4 }}>{tc.icon}</Text>
                <Text
                  style={{ color: "#F8F8FF", fontSize: 18, fontWeight: "800" }}
                >
                  {tc.label}
                </Text>
                <Text style={{ color: "#9CA3AF", fontSize: 12 }}>{tc.tag}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Play Button / Searching State */}
        {status === "searching" ? (
          <View
            style={{
              backgroundColor: "#16161A",
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#7B61FF",
            }}
          >
            <ActivityIndicator
              color="#7B61FF"
              size="large"
              style={{ marginBottom: 14 }}
            />
            <Text style={{ color: "#F8F8FF", fontSize: 17, fontWeight: "700" }}>
              Finding an opponent...
            </Text>
            <Text
              style={{
                color: "#9CA3AF",
                fontSize: 13,
                marginTop: 4,
                marginBottom: 16,
              }}
            >
              {
                TIME_CONTROLS.find((t) => t.value === selectedTimeControl)
                  ?.label
              }{" "}
              game
            </Text>
            <TouchableOpacity onPress={handleCancel}>
              <Text
                style={{ color: "#EF4444", fontSize: 14, fontWeight: "700" }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <GradientButton label="🎮  Find a Game" onPress={handleFindGame} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

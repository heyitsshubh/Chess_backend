// ============================================================
// Home / Lobby Screen — Material Design 3
// ============================================================
import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Surface,
  Chip,
  ActivityIndicator,
  Button,
  Avatar,
  Divider,
  Badge,
} from "react-native-paper";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientButton } from "@/components/ui/GradientButton";
import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";
import { useSocket } from "@/hooks/useSocket";
import { MD_COLORS } from "@/theme";

const TIME_CONTROLS = [
  { label: "1 min", value: "1|0", icon: "lightning-bolt", tag: "Bullet" },
  { label: "3 min", value: "3|0", icon: "fire",            tag: "Blitz"  },
  { label: "5 min", value: "5|0", icon: "timer-outline",   tag: "Blitz"  },
  { label: "10 min", value: "10|0", icon: "chess-knight",  tag: "Rapid"  },
];

const STAT_ROWS = [
  { key: "W", label: "Wins",   color: MD_COLORS.win  },
  { key: "D", label: "Draws",  color: MD_COLORS.draw },
  { key: "L", label: "Losses", color: MD_COLORS.loss },
];

export default function HomeScreen() {
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const status = useGameStore((s) => s.status);
  const game   = useGameStore((s) => s.game);
  const { joinQueue, leaveQueue } = useSocket();
  const [selected, setSelected] = useState("3|0");

  const handleFindGame = () => {
    useGameStore.getState().setSearching();
    joinQueue(selected);
  };

  React.useEffect(() => {
    if (status === "playing" && game) router.push("/(app)/game");
  }, [status, game]);

  const initials = user?.username?.[0]?.toUpperCase() ?? "?";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Top App Bar ── */}
        <View style={styles.topBar}>
          <View style={styles.userRow}>
            <Avatar.Text size={44} label={initials} style={styles.avatar} />
            <View style={{ marginLeft: 12 }}>
              <Text variant="labelSmall" style={styles.welcomeLabel}>Welcome back</Text>
              <Text variant="titleMedium" style={styles.username}>{user?.username ?? "—"}</Text>
            </View>
          </View>
          <Button
            mode="outlined"
            onPress={logout}
            icon="logout"
            compact
            textColor={MD_COLORS.onSurfaceVariant}
            style={styles.logoutBtn}
          >
            Sign Out
          </Button>
        </View>

        {/* ── Rating Card ── */}
        <Surface style={styles.ratingCard} elevation={3}>
          <View style={styles.ratingHeader}>
            <Text variant="labelMedium" style={styles.ratingLabel}>YOUR RATING</Text>
            <Badge style={styles.badge}>Unranked</Badge>
          </View>
          <View style={styles.ratingRow}>
            <Text variant="displayMedium" style={styles.ratingNum}>1200</Text>
            <Text variant="titleSmall" style={styles.eloLabel}>ELO</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.statsRow}>
            {STAT_ROWS.map(({ key, label, color }) => (
              <View key={key} style={styles.statItem}>
                <Text variant="displaySmall" style={[styles.statNum, { color }]}>0</Text>
                <Text variant="labelSmall" style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </Surface>

        {/* ── Time Control ── */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Choose Time Control</Text>
        <View style={styles.chipGrid}>
          {TIME_CONTROLS.map((tc) => (
            <Chip
              key={tc.value}
              selected={selected === tc.value}
              onPress={() => setSelected(tc.value)}
              icon={tc.icon}
              style={[
                styles.chip,
                selected === tc.value && styles.chipSelected,
              ]}
              textStyle={[
                styles.chipText,
                selected === tc.value && styles.chipTextSelected,
              ]}
              showSelectedCheck={false}
            >
              {tc.label} · {tc.tag}
            </Chip>
          ))}
        </View>

        {/* ── Play / Searching ── */}
        {status === "searching" ? (
          <Surface style={styles.searchingCard} elevation={2}>
            <ActivityIndicator size="large" color={MD_COLORS.primary} style={{ marginBottom: 16 }} />
            <Text variant="titleMedium" style={styles.searchingTitle}>Finding Opponent…</Text>
            <Text variant="bodySmall" style={styles.searchingSubtitle}>
              {TIME_CONTROLS.find((t) => t.value === selected)?.label} game
            </Text>
            <Button
              mode="text"
              onPress={leaveQueue}
              textColor={MD_COLORS.error}
              icon="close-circle-outline"
              style={{ marginTop: 12 }}
            >
              Cancel
            </Button>
          </Surface>
        ) : (
          <GradientButton
            label="Find a Game"
            onPress={handleFindGame}
            icon="chess-king"
            style={styles.playBtn}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: MD_COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },

  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  userRow: { flexDirection: "row", alignItems: "center" },
  avatar: { backgroundColor: MD_COLORS.primaryContainer },
  welcomeLabel: { color: MD_COLORS.onSurfaceVariant },
  username: { color: MD_COLORS.onSurface, fontWeight: "700" },
  logoutBtn: { borderColor: MD_COLORS.outline, borderRadius: 20 },

  ratingCard: {
    backgroundColor: MD_COLORS.surfaceVariant,
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
  },
  ratingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ratingLabel: { color: MD_COLORS.onSurfaceVariant, letterSpacing: 1 },
  badge: { backgroundColor: MD_COLORS.primaryContainer, color: "#E9DDFF" },
  ratingRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 8 },
  ratingNum: { color: MD_COLORS.primary, fontWeight: "900" },
  eloLabel: { color: MD_COLORS.onSurfaceVariant },
  divider: { backgroundColor: MD_COLORS.outline, marginVertical: 16, opacity: 0.3 },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statNum: { fontWeight: "800" },
  statLabel: { color: MD_COLORS.onSurfaceVariant, marginTop: 2 },

  sectionTitle: { color: MD_COLORS.onSurface, fontWeight: "700", marginBottom: 12 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  chip: {
    backgroundColor: MD_COLORS.surface,
    borderWidth: 1,
    borderColor: MD_COLORS.outline,
    borderRadius: 12,
    flex: 1,
    minWidth: "45%",
    height: 48,
  },
  chipSelected: {
    backgroundColor: MD_COLORS.primaryContainer,
    borderColor: MD_COLORS.primary,
  },
  chipText: { color: MD_COLORS.onSurface, fontSize: 14 },
  chipTextSelected: { color: "#E9DDFF", fontWeight: "700" },

  searchingCard: {
    backgroundColor: MD_COLORS.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: MD_COLORS.primary + "66",
  },
  searchingTitle: { color: MD_COLORS.onSurface, fontWeight: "700" },
  searchingSubtitle: { color: MD_COLORS.onSurfaceVariant, marginTop: 4 },

  playBtn: { borderRadius: 16 },
});

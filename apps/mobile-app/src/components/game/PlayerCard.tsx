// ============================================================
// PlayerCard — Material Design 3
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Surface, Avatar, Icon } from "react-native-paper";
import { MD_COLORS } from "@/theme";

interface Props {
  username: string;
  elo: number;
  timeMs: number;
  isActive: boolean;
  side: "top" | "bottom";
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlayerCard({ username, elo, timeMs, isActive, side }: Props) {
  const [remaining, setRemaining] = useState(timeMs);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setRemaining(timeMs); }, [timeMs]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => Math.max(0, prev - 100));
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive]);

  const isLow = remaining < 30_000;
  const clockBg    = isLow && isActive ? MD_COLORS.error : MD_COLORS.surface;
  const clockColor = isLow && isActive ? "#fff" : MD_COLORS.onSurface;

  return (
    <Surface
      style={[
        styles.card,
        isActive && styles.cardActive,
      ]}
      elevation={isActive ? 2 : 0}
    >
      <View style={styles.left}>
        <Avatar.Text
          size={40}
          label={username[0].toUpperCase()}
          style={[styles.avatar, isActive && styles.avatarActive]}
        />
        <View style={{ marginLeft: 10 }}>
          <Text variant="titleSmall" style={styles.name}>{username}</Text>
          <View style={styles.eloRow}>
            <Icon source="chess-king" size={12} color={MD_COLORS.secondary} />
            <Text variant="labelSmall" style={styles.elo}>{elo} ELO</Text>
          </View>
        </View>
      </View>

      <View style={[styles.clock, { backgroundColor: clockBg }]}>
        <Text variant="titleMedium" style={[styles.clockText, { color: clockColor }]}>
          {formatTime(remaining)}
        </Text>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: MD_COLORS.surface,
    borderRadius: 16,
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: MD_COLORS.outline + "44",
  },
  cardActive: {
    borderColor: MD_COLORS.primary + "99",
    backgroundColor: MD_COLORS.surfaceVariant,
  },
  left: { flexDirection: "row", alignItems: "center" },
  avatar: { backgroundColor: MD_COLORS.primaryContainer },
  avatarActive: { backgroundColor: MD_COLORS.primaryContainer },
  name: { color: MD_COLORS.onSurface, fontWeight: "700" },
  eloRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  elo: { color: MD_COLORS.secondary },
  clock: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 72,
    alignItems: "center",
  },
  clockText: { fontWeight: "800", fontVariant: ["tabular-nums"] },
});

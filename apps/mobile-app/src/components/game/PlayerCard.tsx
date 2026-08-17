// ============================================================
// PlayerCard Component
//
// Shows player info and live countdown timer.
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native";

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

  useEffect(() => {
    setRemaining(timeMs);
  }, [timeMs]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => Math.max(0, prev - 100));
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const isLow = remaining < 30_000;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: isActive ? "#1C1C22" : "#16161A",
        borderRadius: 12,
        padding: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: isActive ? "#7B61FF" : "#2A2A35",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#7B61FF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
            {username[0].toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={{ color: "#F8F8FF", fontWeight: "700", fontSize: 15 }}>
            {username}
          </Text>
          <Text style={{ color: "#9CA3AF", fontSize: 12 }}>{elo} ELO</Text>
        </View>
      </View>
      <View
        style={{
          backgroundColor: isLow && isActive ? "#EF4444" : "#2A2A35",
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 8,
        }}
      >
        <Text
          style={{
            color: isLow && isActive ? "#fff" : "#F8F8FF",
            fontWeight: "800",
            fontSize: 18,
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatTime(remaining)}
        </Text>
      </View>
    </View>
  );
}

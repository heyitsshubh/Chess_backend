// ============================================================
// Live Game Screen — Material Design 3
// ============================================================
import React, { useCallback } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text, Surface, Button, Icon } from "react-native-paper";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChessBoard } from "@/components/game/ChessBoard";
import { PlayerCard } from "@/components/game/PlayerCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { useGameStore } from "@/store/gameStore";
import { useAuthStore } from "@/store/authStore";
import { useSocket } from "@/hooks/useSocket";
import { MD_COLORS } from "@/theme";

export default function GameScreen() {
  const game   = useGameStore((s) => s.game);
  const status = useGameStore((s) => s.status);
  const reset  = useGameStore((s) => s.reset);
  const user   = useAuthStore((s) => s.user);
  const { sendMove, resign } = useSocket();

  const handleMove = useCallback(
    (from: number, to: number) => {
      if (!game) return;
      const moveEncoded = (from << 6) | to;
      sendMove(game.gameId, moveEncoded);
    },
    [game, sendMove],
  );

  const handleResign = () => {
    Alert.alert("Resign?", "Are you sure you want to resign this game?", [
      { text: "Cancel", style: "cancel" },
      { text: "Resign", style: "destructive", onPress: () => { if (game) resign(game.gameId); } },
    ]);
  };

  const handleBackToLobby = () => {
    reset();
    router.replace("/(app)");
  };

  if (!game) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Icon source="chess-board" size={64} color={MD_COLORS.onSurfaceVariant} />
          <Text variant="titleMedium" style={styles.emptyText}>No active game</Text>
          <Button mode="contained" onPress={handleBackToLobby} style={styles.emptyBtn} icon="home">
            Back to Lobby
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const opponent  = game.myColor === "white" ? game.black : game.white;
  const me        = game.myColor === "white" ? game.white : game.black;
  const isMyTurn  = game.currentTurn === game.myColor;
  const isGameOver = status === "ended";

  const turnColor   = isMyTurn ? MD_COLORS.win  : MD_COLORS.onSurfaceVariant;
  const turnBg      = isMyTurn ? "#0D2010"       : MD_COLORS.surface;
  const turnBorder  = isMyTurn ? MD_COLORS.win   : MD_COLORS.outline;
  const turnIcon    = isGameOver ? "flag-checkered" : isMyTurn ? "circle" : "timer-sand";
  const turnLabel   = isGameOver ? "Game Over" : isMyTurn ? "Your Turn" : "Opponent Thinking…";

  const resultIcon  = game.winner === game.myColor ? "trophy" : game.winner === "draw" ? "handshake" : "heart-broken";
  const resultText  = game.winner === game.myColor ? "You Won!" : game.winner === "draw" ? "Draw" : "You Lost";
  const resultColor = game.winner === game.myColor ? MD_COLORS.win : game.winner === "draw" ? MD_COLORS.draw : MD_COLORS.loss;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Button
            mode="text"
            onPress={handleBackToLobby}
            icon="arrow-left"
            textColor={MD_COLORS.primary}
            compact
          >
            Lobby
          </Button>
          <Surface
            style={[styles.turnBadge, { backgroundColor: turnBg, borderColor: turnBorder }]}
            elevation={0}
          >
            <Icon source={turnIcon} size={14} color={turnColor} />
            <Text variant="labelMedium" style={{ color: turnColor, marginLeft: 6, fontWeight: "700" }}>
              {turnLabel}
            </Text>
          </Surface>
        </View>

        {/* ── Opponent ── */}
        <PlayerCard
          username={opponent.username}
          elo={opponent.elo}
          timeMs={game.myColor === "white" ? game.blackTime : game.whiteTime}
          isActive={!isMyTurn && !isGameOver}
          side="top"
        />

        {/* ── Board ── */}
        <View style={styles.boardWrapper}>
          <ChessBoard
            fen={game.fen}
            myColor={game.myColor}
            onMove={handleMove}
            isMyTurn={isMyTurn && !isGameOver}
          />
        </View>

        {/* ── Me ── */}
        <PlayerCard
          username={me.username}
          elo={me.elo}
          timeMs={game.myColor === "white" ? game.whiteTime : game.blackTime}
          isActive={isMyTurn && !isGameOver}
          side="bottom"
        />

        {/* ── Game Over Banner ── */}
        {isGameOver && (
          <Surface style={styles.resultCard} elevation={3}>
            <Icon source={resultIcon} size={40} color={resultColor} />
            <Text variant="headlineSmall" style={[styles.resultText, { color: resultColor }]}>
              {resultText}
            </Text>
            <Text variant="bodySmall" style={styles.resultReason}>
              {game.endReason?.replace(/_/g, " ")}
            </Text>
            <GradientButton label="Back to Lobby" onPress={handleBackToLobby} icon="home" style={{ marginTop: 16 }} />
          </Surface>
        )}

        {/* ── Resign ── */}
        {!isGameOver && (
          <Button
            mode="text"
            onPress={handleResign}
            icon="flag-outline"
            textColor={MD_COLORS.error}
            style={styles.resignBtn}
          >
            Resign
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: MD_COLORS.background },
  container: { flex: 1, padding: 16 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  emptyText: { color: MD_COLORS.onSurfaceVariant },
  emptyBtn: { marginTop: 8, borderRadius: 12 },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  turnBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
  },

  boardWrapper: { alignItems: "center", marginVertical: 8 },

  resultCard: {
    backgroundColor: MD_COLORS.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: MD_COLORS.outline,
    gap: 8,
  },
  resultText: { fontWeight: "800" },
  resultReason: { color: MD_COLORS.onSurfaceVariant, textTransform: "capitalize" },

  resignBtn: { marginTop: 4, alignSelf: "center" },
});

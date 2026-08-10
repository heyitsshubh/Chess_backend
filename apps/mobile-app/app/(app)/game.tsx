// ============================================================
// Live Game Screen
//
// Full chess game view. Shows both player cards, the board,
// and controls (resign). Wired to gameStore via socket events.
// ============================================================
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChessBoard } from '@/components/game/ChessBoard';
import { PlayerCard } from '@/components/game/PlayerCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';

export default function GameScreen() {
  const game = useGameStore((s) => s.game);
  const status = useGameStore((s) => s.status);
  const reset = useGameStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);
  const { sendMove, resign } = useSocket();

  const handleMove = useCallback(
    (from: number, to: number) => {
      if (!game) return;
      // Encode move as a packed integer (from << 6 | to) — matches our engine format
      const moveEncoded = (from << 6) | to;
      sendMove(game.gameId, moveEncoded);
    },
    [game, sendMove]
  );

  const handleResign = () => {
    Alert.alert('Resign?', 'Are you sure you want to resign this game?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resign',
        style: 'destructive',
        onPress: () => {
          if (game) resign(game.gameId);
        },
      },
    ]);
  };

  const handleBackToLobby = () => {
    reset();
    router.replace('/(app)');
  };

  if (!game) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0D0D0F', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#9CA3AF' }}>No active game</Text>
        <TouchableOpacity onPress={handleBackToLobby} style={{ marginTop: 16 }}>
          <Text style={{ color: '#7B61FF', fontWeight: '700' }}>Back to Lobby</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const opponent = game.myColor === 'white' ? game.black : game.white;
  const me = game.myColor === 'white' ? game.white : game.black;
  const isMyTurn = game.currentTurn === game.myColor;

  const isGameOver = status === 'ended';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0D0D0F' }}>
      <View style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity
            onPress={handleBackToLobby}
            style={{ paddingRight: 12 }}
          >
            <Text style={{ color: '#7B61FF', fontSize: 15, fontWeight: '700' }}>← Lobby</Text>
          </TouchableOpacity>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              backgroundColor: isMyTurn ? '#1a2310' : '#1C1C22',
              borderRadius: 10,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: isMyTurn ? '#22C55E' : '#2A2A35',
            }}
          >
            <Text style={{ color: isMyTurn ? '#22C55E' : '#9CA3AF', fontWeight: '700', fontSize: 13 }}>
              {isGameOver ? '🏁 Game Over' : isMyTurn ? '● Your Turn' : '⏳ Opponent Thinking'}
            </Text>
          </View>
        </View>

        {/* Opponent */}
        <PlayerCard
          username={opponent.username}
          elo={opponent.elo}
          timeMs={game.myColor === 'white' ? game.blackTime : game.whiteTime}
          isActive={!isMyTurn && !isGameOver}
          side="top"
        />

        {/* Chessboard */}
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <ChessBoard
            fen={game.fen}
            myColor={game.myColor}
            onMove={handleMove}
            isMyTurn={isMyTurn && !isGameOver}
          />
        </View>

        {/* Me */}
        <PlayerCard
          username={me.username}
          elo={me.elo}
          timeMs={game.myColor === 'white' ? game.whiteTime : game.blackTime}
          isActive={isMyTurn && !isGameOver}
          side="bottom"
        />

        {/* Game Over Banner */}
        {isGameOver && (
          <View
            style={{
              backgroundColor: '#16161A',
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
              marginTop: 8,
              borderWidth: 1,
              borderColor: '#7B61FF',
            }}
          >
            <Text style={{ color: '#F8F8FF', fontSize: 22, fontWeight: '800', marginBottom: 4 }}>
              {game.winner === game.myColor
                ? '🏆 You Won!'
                : game.winner === 'draw'
                ? '🤝 Draw'
                : '💔 You Lost'}
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 16 }}>
              {game.endReason?.replace(/_/g, ' ')}
            </Text>
            <GradientButton label="Back to Lobby" onPress={handleBackToLobby} />
          </View>
        )}

        {/* Controls */}
        {!isGameOver && (
          <TouchableOpacity
            onPress={handleResign}
            style={{
              marginTop: 10,
              alignItems: 'center',
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '600' }}>⚑ Resign</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

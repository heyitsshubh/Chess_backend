// ============================================================
// useSocket Hook
//
// Manages the Socket.IO connection lifecycle. The socket is
// created once after authentication and torn down on logout.
// ============================================================
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { initGame, applyMove, endGame, setIdle } = useGameStore();

  useEffect(() => {
    if (!token || !user) return;

    const socket = io(SOCKET_URL, {
      path: '/socket.io/',
      transports: ['websocket'],
      auth: { token },
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('matchmaking:matched', (data) => {
      initGame({ ...data, myUserId: user.sub });
    });

    socket.on('game:move_made', ({ fen, whiteTime, blackTime }) => {
      applyMove(fen, whiteTime, blackTime);
    });

    socket.on('game:end', ({ winner, reason }) => {
      endGame(winner, reason);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user]);

  const joinQueue = useCallback((timeControl: string) => {
    socketRef.current?.emit('matchmaking:join', timeControl);
  }, []);

  const leaveQueue = useCallback(() => {
    socketRef.current?.emit('matchmaking:leave');
    setIdle();
  }, []);

  const sendMove = useCallback((gameId: string, move: number) => {
    socketRef.current?.emit('game:move', { gameId, move });
  }, []);

  const resign = useCallback((gameId: string) => {
    socketRef.current?.emit('game:resign', gameId);
  }, []);

  return { joinQueue, leaveQueue, sendMove, resign, socket: socketRef.current };
}

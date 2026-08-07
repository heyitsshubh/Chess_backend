// ============================================================
// Core Types and Interfaces
// ============================================================

export type TimeControl = '1|0' | '3|0' | '10|0';

export interface PlayerSession {
  userId: string;
  username: string;
  socketId: string;
  elo: number;
}

export interface MatchmakingRequest {
  userId: string;
  username: string;
  timeControl: TimeControl;
  socketId: string;
}

export interface ActiveGame {
  gameId: string;
  white: PlayerSession;
  black: PlayerSession;
  timeControl: TimeControl;
  fen: string;
  // Clocks in milliseconds remaining
  whiteTime: number;
  blackTime: number;
  lastMoveTimestamp: number; // Unix epoch of last move
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED';
}

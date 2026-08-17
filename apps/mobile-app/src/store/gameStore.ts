// ============================================================
// Game Store (Zustand)
//
// Manages matchmaking and live game state.
// Follows SRP - only responsible for chess game state.
// ============================================================
import { create } from "zustand";

export type GameStatus = "idle" | "searching" | "playing" | "ended";
export type PieceColor = "white" | "black";

export interface PlayerInfo {
  userId: string;
  username: string;
  elo: number;
  color: PieceColor;
}

export interface ActiveGame {
  gameId: string;
  fen: string;
  white: PlayerInfo;
  black: PlayerInfo;
  myColor: PieceColor;
  whiteTime: number;
  blackTime: number;
  currentTurn: PieceColor;
  status: GameStatus;
  winner?: PieceColor | "draw";
  endReason?: string;
}

interface GameState {
  status: GameStatus;
  game: ActiveGame | null;
  selectedSquare: number | null;
  validMoves: number[];
  error: string | null;
}

interface GameActions {
  setSearching: () => void;
  setIdle: () => void;
  initGame: (data: {
    gameId: string;
    fen: string;
    white: PlayerInfo;
    black: PlayerInfo;
    myUserId: string;
  }) => void;
  applyMove: (fen: string, whiteTime: number, blackTime: number) => void;
  endGame: (winner: PieceColor | "draw", reason: string) => void;
  selectSquare: (square: number | null) => void;
  setValidMoves: (moves: number[]) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState: GameState = {
  status: "idle",
  game: null,
  selectedSquare: null,
  validMoves: [],
  error: null,
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  setSearching: () => set({ status: "searching" }),
  setIdle: () => set({ status: "idle", game: null }),

  initGame: ({ gameId, fen, white, black, myUserId }) => {
    const myColor: PieceColor = white.userId === myUserId ? "white" : "black";
    set({
      status: "playing",
      game: {
        gameId,
        fen,
        white,
        black,
        myColor,
        whiteTime: 180_000,
        blackTime: 180_000,
        currentTurn: "white",
        status: "playing",
      },
    });
  },

  applyMove: (fen, whiteTime, blackTime) => {
    const { game } = get();
    if (!game) return;
    const currentTurn: PieceColor =
      game.currentTurn === "white" ? "black" : "white";
    set({
      game: { ...game, fen, whiteTime, blackTime, currentTurn },
      selectedSquare: null,
      validMoves: [],
    });
  },

  endGame: (winner, reason) => {
    const { game } = get();
    if (!game) return;
    set({
      game: { ...game, status: "ended", winner, endReason: reason },
      status: "ended",
    });
  },

  selectSquare: (square) => set({ selectedSquare: square }),
  setValidMoves: (moves) => set({ validMoves: moves }),
  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));

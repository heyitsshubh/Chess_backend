export enum Color {
  WHITE = 0,
  BLACK = 1,
}

export enum PieceType {
  PAWN = 0,
  KNIGHT = 1,
  BISHOP = 2,
  ROOK = 3,
  QUEEN = 4,
  KING = 5,
}

// Used for fast lookup by piece index (Color * 6 + PieceType)
export const PIECE_TYPE_COUNT = 6;
export const COLOR_COUNT = 2;

// Castling rights bit masks
export enum CastlingRights {
  NONE = 0,
  WHITE_KINGSIDE = 1 << 0,
  WHITE_QUEENSIDE = 1 << 1,
  BLACK_KINGSIDE = 1 << 2,
  BLACK_QUEENSIDE = 1 << 3,
  ALL = 15, // 1 | 2 | 4 | 8
}

import { PieceType } from "../constants/Enums";

// Move encoding (16 bits):
// 0-5: from square (0-63)
// 6-11: to square (0-63)
// 12-15: flags (promotions, captures, special moves)

export enum MoveFlags {
  QUIET = 0,
  DOUBLE_PAWN_PUSH = 1,
  KING_CASTLE = 2,
  QUEEN_CASTLE = 3,
  CAPTURE = 4,
  EP_CAPTURE = 5,
  // Promotions
  PR_KNIGHT = 8,
  PR_BISHOP = 9,
  PR_ROOK = 10,
  PR_QUEEN = 11,
  // Promotion captures
  PC_KNIGHT = 12,
  PC_BISHOP = 13,
  PC_ROOK = 14,
  PC_QUEEN = 15,
}

export class Move {
  static encode(from: number, to: number, flags: MoveFlags): number {
    return (flags << 12) | (to << 6) | from;
  }

  static getFrom(move: number): number {
    return move & 0x3f;
  }

  static getTo(move: number): number {
    return (move >> 6) & 0x3f;
  }

  static getFlags(move: number): MoveFlags {
    return (move >> 12) & 0xf;
  }

  static isCapture(move: number): boolean {
    const flags = Move.getFlags(move);
    return (flags & MoveFlags.CAPTURE) !== 0 || flags === MoveFlags.EP_CAPTURE;
  }

  static isPromotion(move: number): boolean {
    return (Move.getFlags(move) & 8) !== 0;
  }

  static getPromotedPiece(move: number): PieceType {
    const flags = Move.getFlags(move);
    switch (flags & 3) {
      case 0:
        return PieceType.KNIGHT;
      case 1:
        return PieceType.BISHOP;
      case 2:
        return PieceType.ROOK;
      case 3:
        return PieceType.QUEEN;
      default:
        return PieceType.PAWN; // Should never reach
    }
  }
}

import { Color, PIECE_TYPE_COUNT } from "../constants/Enums";
import { Square } from "../constants/Squares";

// Simple PRNG for generating reproducible 64-bit numbers
// Using Mulberry32 approach for 32-bit halves, combined into BigInt
class PRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  next32(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  }

  next64(): bigint {
    const high = BigInt(this.next32());
    const low = BigInt(this.next32());
    return (high << 32n) | low;
  }
}

const prng = new PRNG(0x12345678);

export const ZOBRIST_PIECES: bigint[][][] = Array.from({ length: 2 }, () =>
  Array.from({ length: PIECE_TYPE_COUNT }, () =>
    Array.from({ length: 64 }, () => prng.next64()),
  ),
);

// 16 combinations for castling rights (0 to 15)
export const ZOBRIST_CASTLING: bigint[] = Array.from({ length: 16 }, () =>
  prng.next64(),
);

// En passant files (8 files) + 1 for 'none'
export const ZOBRIST_EN_PASSANT: bigint[] = Array.from({ length: 9 }, () =>
  prng.next64(),
);

// Side to move (only applied if it's BLACK's turn)
export const ZOBRIST_SIDE: bigint = prng.next64();

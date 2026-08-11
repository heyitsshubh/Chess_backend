// BigInt is required for 64-bit precise bitwise operations in JS/TS.

export const EMPTY_BB: bigint = 0n;
export const UNIVERSE_BB: bigint = 0xffffffffffffffffn;

// File masks
export const FILE_A: bigint = 0x0101010101010101n;
export const FILE_B: bigint = FILE_A << 1n;
export const FILE_C: bigint = FILE_A << 2n;
export const FILE_D: bigint = FILE_A << 3n;
export const FILE_E: bigint = FILE_A << 4n;
export const FILE_F: bigint = FILE_A << 5n;
export const FILE_G: bigint = FILE_A << 6n;
export const FILE_H: bigint = FILE_A << 7n;

// Rank masks
export const RANK_1: bigint = 0x00000000000000ffn;
export const RANK_2: bigint = RANK_1 << 8n;
export const RANK_3: bigint = RANK_1 << 16n;
export const RANK_4: bigint = RANK_1 << 24n;
export const RANK_5: bigint = RANK_1 << 32n;
export const RANK_6: bigint = RANK_1 << 40n;
export const RANK_7: bigint = RANK_1 << 48n;
export const RANK_8: bigint = RANK_1 << 56n;

// Common Helpers
export function setBit(bitboard: bigint, square: number): bigint {
  return bitboard | (1n << BigInt(square));
}

export function clearBit(bitboard: bigint, square: number): bigint {
  return bitboard & ~(1n << BigInt(square));
}

export function checkBit(bitboard: bigint, square: number): boolean {
  return (bitboard & (1n << BigInt(square))) !== 0n;
}

export function popCount(bitboard: bigint): number {
  let count = 0;
  let temp = bitboard;
  while (temp !== 0n) {
    count++;
    temp &= temp - 1n;
  }
  return count;
}

export function getLSB(bitboard: bigint): number {
  if (bitboard === 0n) return -1;
  // bitboard & -bitboard gives the LSB, then we need the index.
  // JS BigInt doesn't have a fast native LSB index, so we can use a lookup or loop.
  // For performance, an isolated LSB operation:
  let b = bitboard ^ (bitboard - 1n);
  let index = 0;
  if ((b & 0xffffffff00000000n) !== 0n) {
    index += 32;
    b >>= 32n;
  }
  if ((b & 0xffff0000n) !== 0n) {
    index += 16;
    b >>= 16n;
  }
  if ((b & 0xff00n) !== 0n) {
    index += 8;
    b >>= 8n;
  }
  if ((b & 0xf0n) !== 0n) {
    index += 4;
    b >>= 4n;
  }
  if ((b & 0xcn) !== 0n) {
    index += 2;
    b >>= 2n;
  }
  if ((b & 0x2n) !== 0n) {
    index += 1;
  }
  return index;
}

export function popLSB(bitboard: bigint): [number, bigint] {
  const lsb = getLSB(bitboard);
  return [lsb, bitboard & (bitboard - 1n)];
}

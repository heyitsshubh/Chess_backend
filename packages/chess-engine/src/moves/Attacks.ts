import { setBit, clearBit, EMPTY_BB } from "../constants/Bitboards";

export const KNIGHT_ATTACKS: bigint[] = new Array(64).fill(EMPTY_BB);
export const KING_ATTACKS: bigint[] = new Array(64).fill(EMPTY_BB);
export const PAWN_ATTACKS: bigint[][] = [
  new Array(64).fill(EMPTY_BB),
  new Array(64).fill(EMPTY_BB),
];

// Pre-calculate non-sliding attacks
function initNonSlidingAttacks() {
  const knightOffsets = [15, 17, 6, 10, -15, -17, -6, -10];
  const kingOffsets = [7, 8, 9, 1, -1, -7, -8, -9];

  for (let sq = 0; sq < 64; sq++) {
    const file = sq % 8;
    const rank = Math.floor(sq / 8);

    // Knight
    for (const offset of knightOffsets) {
      const target = sq + offset;
      if (target >= 0 && target < 64) {
        const tFile = target % 8;
        const tRank = Math.floor(target / 8);
        if (Math.abs(file - tFile) <= 2 && Math.abs(rank - tRank) <= 2) {
          KNIGHT_ATTACKS[sq] = setBit(KNIGHT_ATTACKS[sq], target);
        }
      }
    }

    // King
    for (const offset of kingOffsets) {
      const target = sq + offset;
      if (target >= 0 && target < 64) {
        const tFile = target % 8;
        const tRank = Math.floor(target / 8);
        if (Math.abs(file - tFile) <= 1 && Math.abs(rank - tRank) <= 1) {
          KING_ATTACKS[sq] = setBit(KING_ATTACKS[sq], target);
        }
      }
    }

    // White Pawns
    if (rank < 7) {
      if (file > 0) PAWN_ATTACKS[0][sq] = setBit(PAWN_ATTACKS[0][sq], sq + 7);
      if (file < 7) PAWN_ATTACKS[0][sq] = setBit(PAWN_ATTACKS[0][sq], sq + 9);
    }

    // Black Pawns
    if (rank > 0) {
      if (file > 0) PAWN_ATTACKS[1][sq] = setBit(PAWN_ATTACKS[1][sq], sq - 9);
      if (file < 7) PAWN_ATTACKS[1][sq] = setBit(PAWN_ATTACKS[1][sq], sq - 7);
    }
  }
}

initNonSlidingAttacks();

// Directional Rays for sliding pieces
export const RAYS: bigint[][] = Array.from({ length: 64 }, () =>
  new Array(8).fill(EMPTY_BB),
);

// Directions: N, S, E, W, NE, NW, SE, SW
const DIRS = [8, -8, 1, -1, 9, 7, -7, -9];

function initRays() {
  for (let sq = 0; sq < 64; sq++) {
    const file = sq % 8;
    const rank = Math.floor(sq / 8);

    for (let d = 0; d < 8; d++) {
      let r = rank;
      let f = file;
      let target = sq;

      while (true) {
        if (d === 0)
          r++; // N
        else if (d === 1)
          r--; // S
        else if (d === 2)
          f++; // E
        else if (d === 3)
          f--; // W
        else if (d === 4) {
          r++;
          f++;
        } // NE
        else if (d === 5) {
          r++;
          f--;
        } // NW
        else if (d === 6) {
          r--;
          f++;
        } // SE
        else if (d === 7) {
          r--;
          f--;
        } // SW

        target += DIRS[d];

        if (r < 0 || r > 7 || f < 0 || f > 7) break;
        if (target < 0 || target > 63) break;

        RAYS[sq][d] = setBit(RAYS[sq][d], target);
      }
    }
  }
}

initRays();

// Simple ray casting for sliding pieces (slower than magics but robust and simple for TS)
export function getSlidingAttacks(
  sq: number,
  blockers: bigint,
  isBishop: boolean,
  isRook: boolean,
): bigint {
  let attacks = EMPTY_BB;

  const dirIndices = [];
  if (isRook) dirIndices.push(0, 1, 2, 3);
  if (isBishop) dirIndices.push(4, 5, 6, 7);

  for (const d of dirIndices) {
    let ray = RAYS[sq][d];
    const intersection = ray & blockers;
    if (intersection !== EMPTY_BB) {
      // Find the first blocker in the ray.
      // Depending on direction, we want the LSB or MSB of the intersection.
      // N, E, NE, NW (positive index changes) -> LSB
      // S, W, SE, SW (negative index changes) -> MSB (highest bit)

      let blockerSq = -1;
      if (d === 0 || d === 2 || d === 4 || d === 5) {
        // Forward direction: smallest square index
        // Use custom getLSB if needed or standard bitwise logic
        let b = intersection ^ (intersection - 1n);
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
        blockerSq = index;
      } else {
        // Backward direction: largest square index (MSB)
        // Simple loop for MSB
        let index = 63;
        const temp = intersection;
        while ((temp & (1n << BigInt(index))) === 0n) {
          index--;
        }
        blockerSq = index;
      }

      // Mask out bits behind the blocker
      ray ^= RAYS[blockerSq][d];
    }
    attacks |= ray;
  }

  return attacks;
}

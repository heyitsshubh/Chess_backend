import { Board } from "../core/Board";
import { Color, PieceType, CastlingRights } from "../constants/Enums";
import {
  EMPTY_BB,
  checkBit,
  getLSB,
  popLSB,
  setBit,
} from "../constants/Bitboards";
import {
  KNIGHT_ATTACKS,
  KING_ATTACKS,
  PAWN_ATTACKS,
  getSlidingAttacks,
} from "./Attacks";
import { Move, MoveFlags } from "../core/Move";

export class MoveGenerator {
  public static generateMoves(board: Board): number[] {
    const moves: number[] = [];
    const side = board.sideToMove;
    const opp = side ^ 1;

    const ourPieces = board.colors[side];
    const oppPieces = board.colors[opp];
    const allPieces = board.allPieces;

    const pawns = board.getPieceBitboard(side, PieceType.PAWN);
    const knights = board.getPieceBitboard(side, PieceType.KNIGHT);
    const bishops = board.getPieceBitboard(side, PieceType.BISHOP);
    const rooks = board.getPieceBitboard(side, PieceType.ROOK);
    const queens = board.getPieceBitboard(side, PieceType.QUEEN);
    const king = board.getPieceBitboard(side, PieceType.KING);

    const empty = ~allPieces;

    // 1. Pawn Moves
    const pawnDir = side === Color.WHITE ? 8 : -8;
    const rank3 =
      side === Color.WHITE ? 0x0000000000ff0000n : 0x0000ff0000000000n;
    const rank7 =
      side === Color.WHITE ? 0x00ff000000000000n : 0x000000000000ff00n;

    let pTemp = pawns;
    while (pTemp !== EMPTY_BB) {
      const [sq, rem] = popLSB(pTemp);
      pTemp = rem;

      const isPromo = checkBit(rank7, sq);

      // Single Push
      const single = sq + pawnDir;
      if (checkBit(empty, single)) {
        this.addPawnMoves(moves, sq, single, isPromo, MoveFlags.QUIET);
        // Double Push
        if (!isPromo) {
          const isRank2 = side === Color.WHITE ? sq < 16 : sq >= 48;
          if (isRank2) {
            const double = sq + pawnDir * 2;
            if (checkBit(empty, double)) {
              moves.push(Move.encode(sq, double, MoveFlags.DOUBLE_PAWN_PUSH));
            }
          }
        }
      }

      // Captures
      let attacks = PAWN_ATTACKS[side][sq] & oppPieces;
      while (attacks !== EMPTY_BB) {
        const [tSq, aRem] = popLSB(attacks);
        attacks = aRem;
        this.addPawnMoves(moves, sq, tSq, isPromo, MoveFlags.CAPTURE);
      }

      // En Passant
      if (board.enPassantSquare !== -1) {
        const epAttacks =
          PAWN_ATTACKS[side][sq] & (1n << BigInt(board.enPassantSquare));
        if (epAttacks !== EMPTY_BB) {
          moves.push(
            Move.encode(sq, board.enPassantSquare, MoveFlags.EP_CAPTURE),
          );
        }
      }
    }

    // 2. Knights
    let nTemp = knights;
    while (nTemp !== EMPTY_BB) {
      const [sq, rem] = popLSB(nTemp);
      nTemp = rem;
      let attacks = KNIGHT_ATTACKS[sq] & ~ourPieces;
      while (attacks !== EMPTY_BB) {
        const [tSq, aRem] = popLSB(attacks);
        attacks = aRem;
        const flags = checkBit(oppPieces, tSq)
          ? MoveFlags.CAPTURE
          : MoveFlags.QUIET;
        moves.push(Move.encode(sq, tSq, flags));
      }
    }

    // 3. Sliding Pieces (Bishops, Rooks, Queens)
    this.generateSliding(
      moves,
      bishops,
      allPieces,
      ourPieces,
      oppPieces,
      true,
      false,
    );
    this.generateSliding(
      moves,
      rooks,
      allPieces,
      ourPieces,
      oppPieces,
      false,
      true,
    );
    this.generateSliding(
      moves,
      queens,
      allPieces,
      ourPieces,
      oppPieces,
      true,
      true,
    );

    // 4. King
    const kTemp = king;
    if (kTemp !== EMPTY_BB) {
      const kSq = getLSB(kTemp);
      let attacks = KING_ATTACKS[kSq] & ~ourPieces;
      while (attacks !== EMPTY_BB) {
        const [tSq, aRem] = popLSB(attacks);
        attacks = aRem;
        const flags = checkBit(oppPieces, tSq)
          ? MoveFlags.CAPTURE
          : MoveFlags.QUIET;
        moves.push(Move.encode(kSq, tSq, flags));
      }

      // Castling
      this.generateCastling(moves, board, kSq, side, allPieces);
    }

    return moves;
  }

  private static generateSliding(
    moves: number[],
    pieces: bigint,
    allPieces: bigint,
    ourPieces: bigint,
    oppPieces: bigint,
    isBishop: boolean,
    isRook: boolean,
  ) {
    let pTemp = pieces;
    while (pTemp !== EMPTY_BB) {
      const [sq, rem] = popLSB(pTemp);
      pTemp = rem;
      let attacks =
        getSlidingAttacks(sq, allPieces, isBishop, isRook) & ~ourPieces;
      while (attacks !== EMPTY_BB) {
        const [tSq, aRem] = popLSB(attacks);
        attacks = aRem;
        const flags = checkBit(oppPieces, tSq)
          ? MoveFlags.CAPTURE
          : MoveFlags.QUIET;
        moves.push(Move.encode(sq, tSq, flags));
      }
    }
  }

  private static addPawnMoves(
    moves: number[],
    sq: number,
    tSq: number,
    isPromo: boolean,
    baseFlag: MoveFlags,
  ) {
    if (isPromo) {
      const isCapture = baseFlag === MoveFlags.CAPTURE;
      moves.push(
        Move.encode(
          sq,
          tSq,
          isCapture ? MoveFlags.PC_QUEEN : MoveFlags.PR_QUEEN,
        ),
      );
      moves.push(
        Move.encode(sq, tSq, isCapture ? MoveFlags.PC_ROOK : MoveFlags.PR_ROOK),
      );
      moves.push(
        Move.encode(
          sq,
          tSq,
          isCapture ? MoveFlags.PC_BISHOP : MoveFlags.PR_BISHOP,
        ),
      );
      moves.push(
        Move.encode(
          sq,
          tSq,
          isCapture ? MoveFlags.PC_KNIGHT : MoveFlags.PR_KNIGHT,
        ),
      );
    } else {
      moves.push(Move.encode(sq, tSq, baseFlag));
    }
  }

  private static generateCastling(
    moves: number[],
    board: Board,
    kSq: number,
    side: Color,
    allPieces: bigint,
  ) {
    if (side === Color.WHITE) {
      if ((board.castlingRights & CastlingRights.WHITE_KINGSIDE) !== 0) {
        if (!checkBit(allPieces, 5) && !checkBit(allPieces, 6)) {
          if (
            !this.isSquareAttacked(board, 4, Color.BLACK) &&
            !this.isSquareAttacked(board, 5, Color.BLACK)
          ) {
            moves.push(Move.encode(kSq, 6, MoveFlags.KING_CASTLE));
          }
        }
      }
      if ((board.castlingRights & CastlingRights.WHITE_QUEENSIDE) !== 0) {
        if (
          !checkBit(allPieces, 1) &&
          !checkBit(allPieces, 2) &&
          !checkBit(allPieces, 3)
        ) {
          if (
            !this.isSquareAttacked(board, 4, Color.BLACK) &&
            !this.isSquareAttacked(board, 3, Color.BLACK)
          ) {
            moves.push(Move.encode(kSq, 2, MoveFlags.QUEEN_CASTLE));
          }
        }
      }
    } else {
      if ((board.castlingRights & CastlingRights.BLACK_KINGSIDE) !== 0) {
        if (!checkBit(allPieces, 61) && !checkBit(allPieces, 62)) {
          if (
            !this.isSquareAttacked(board, 60, Color.WHITE) &&
            !this.isSquareAttacked(board, 61, Color.WHITE)
          ) {
            moves.push(Move.encode(kSq, 62, MoveFlags.KING_CASTLE));
          }
        }
      }
      if ((board.castlingRights & CastlingRights.BLACK_QUEENSIDE) !== 0) {
        if (
          !checkBit(allPieces, 57) &&
          !checkBit(allPieces, 58) &&
          !checkBit(allPieces, 59)
        ) {
          if (
            !this.isSquareAttacked(board, 60, Color.WHITE) &&
            !this.isSquareAttacked(board, 59, Color.WHITE)
          ) {
            moves.push(Move.encode(kSq, 58, MoveFlags.QUEEN_CASTLE));
          }
        }
      }
    }
  }

  public static isSquareAttacked(
    board: Board,
    sq: number,
    attackerColor: Color,
  ): boolean {
    const oppPawns = board.getPieceBitboard(attackerColor, PieceType.PAWN);
    const oppKnights = board.getPieceBitboard(attackerColor, PieceType.KNIGHT);
    const oppBishops = board.getPieceBitboard(attackerColor, PieceType.BISHOP);
    const oppRooks = board.getPieceBitboard(attackerColor, PieceType.ROOK);
    const oppQueens = board.getPieceBitboard(attackerColor, PieceType.QUEEN);
    const oppKing = board.getPieceBitboard(attackerColor, PieceType.KING);

    const allPieces = board.allPieces;
    const defColor = attackerColor ^ 1;

    // Pawns
    if ((PAWN_ATTACKS[defColor][sq] & oppPawns) !== EMPTY_BB) return true;

    // Knights
    if ((KNIGHT_ATTACKS[sq] & oppKnights) !== EMPTY_BB) return true;

    // King
    if ((KING_ATTACKS[sq] & oppKing) !== EMPTY_BB) return true;

    // Bishops / Queens
    const bishopAttacks = getSlidingAttacks(sq, allPieces, true, false);
    if ((bishopAttacks & (oppBishops | oppQueens)) !== EMPTY_BB) return true;

    // Rooks / Queens
    const rookAttacks = getSlidingAttacks(sq, allPieces, false, true);
    if ((rookAttacks & (oppRooks | oppQueens)) !== EMPTY_BB) return true;

    return false;
  }
}

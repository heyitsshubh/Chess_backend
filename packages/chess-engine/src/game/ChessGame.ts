import { Board } from "../core/Board";
import { Color, PieceType, CastlingRights } from "../constants/Enums";
import { Square } from "../constants/Squares";
import { Move, MoveFlags } from "../core/Move";
import { MoveGenerator } from "../moves/MoveGenerator";
import { History, GameStateRecord } from "./History";
import { FEN, START_FEN } from "../parsers/FEN";

export class ChessGame {
  public board: Board;
  public history: History;

  constructor(fen: string = START_FEN) {
    this.board = new Board();
    this.history = new History();
    this.loadFen(fen);
  }

  public loadFen(fen: string) {
    FEN.parse(fen, this.board);
    this.history.clear();
    this.history.push({
      move: 0,
      castlingRights: this.board.castlingRights,
      enPassantSquare: this.board.enPassantSquare,
      halfMoveClock: this.board.halfMoveClock,
      hashKey: this.board.hashKey,
      capturedPiece: -1,
    });
  }

  public getFen(): string {
    return FEN.stringify(this.board);
  }

  public generateLegalMoves(): number[] {
    const pseudoMoves = MoveGenerator.generateMoves(this.board);
    const legalMoves: number[] = [];

    for (const move of pseudoMoves) {
      if (this.makeMove(move)) {
        legalMoves.push(move);
        this.undoMove();
      }
    }
    return legalMoves;
  }

  // Returns true if the move was legal and made, false otherwise
  public makeMove(move: number): boolean {
    const from = Move.getFrom(move);
    const to = Move.getTo(move);
    const flags = Move.getFlags(move);
    const side = this.board.sideToMove;
    const opp = side ^ 1;

    const movingPiece = this.board.getPieceAt(from)!;
    let capturedPiece = -1;

    const oldEp = this.board.enPassantSquare;
    const oldCastling = this.board.castlingRights;
    const oldHalfMove = this.board.halfMoveClock;

    // Handle captures
    if (Move.isCapture(move)) {
      if (flags === MoveFlags.EP_CAPTURE) {
        capturedPiece = PieceType.PAWN;
        const capSq = side === Color.WHITE ? to - 8 : to + 8;
        this.board.removePiece(capSq, opp, PieceType.PAWN);
      } else {
        capturedPiece = this.board.getPieceAt(to)!.piece;
        this.board.removePiece(to, opp, capturedPiece);
      }
    }

    // Move piece
    this.board.removePiece(from, side, movingPiece.piece);

    // Promotions
    if (Move.isPromotion(move)) {
      this.board.addPiece(to, side, Move.getPromotedPiece(move));
    } else {
      this.board.addPiece(to, side, movingPiece.piece);
    }

    // Handle Castling moves (move the rook)
    if (flags === MoveFlags.KING_CASTLE) {
      if (side === Color.WHITE) {
        this.board.removePiece(7, Color.WHITE, PieceType.ROOK);
        this.board.addPiece(5, Color.WHITE, PieceType.ROOK);
      } else {
        this.board.removePiece(63, Color.BLACK, PieceType.ROOK);
        this.board.addPiece(61, Color.BLACK, PieceType.ROOK);
      }
    } else if (flags === MoveFlags.QUEEN_CASTLE) {
      if (side === Color.WHITE) {
        this.board.removePiece(0, Color.WHITE, PieceType.ROOK);
        this.board.addPiece(3, Color.WHITE, PieceType.ROOK);
      } else {
        this.board.removePiece(56, Color.BLACK, PieceType.ROOK);
        this.board.addPiece(59, Color.BLACK, PieceType.ROOK);
      }
    }

    // Update En Passant
    let newEp = Square.NONE;
    if (flags === MoveFlags.DOUBLE_PAWN_PUSH) {
      newEp = side === Color.WHITE ? to - 8 : to + 8;
    }
    this.board.updateHashEnPassant(oldEp, newEp);

    // Update Castling Rights
    let newRights = oldCastling;
    // Loss of castling rights due to king or rook moves/captures
    const KINGS = [4, 60];
    const K_ROOKS = [7, 63];
    const Q_ROOKS = [0, 56];

    if (from === KINGS[Color.WHITE])
      newRights &= ~(
        CastlingRights.WHITE_KINGSIDE | CastlingRights.WHITE_QUEENSIDE
      );
    if (from === KINGS[Color.BLACK])
      newRights &= ~(
        CastlingRights.BLACK_KINGSIDE | CastlingRights.BLACK_QUEENSIDE
      );
    if (from === K_ROOKS[Color.WHITE] || to === K_ROOKS[Color.WHITE])
      newRights &= ~CastlingRights.WHITE_KINGSIDE;
    if (from === Q_ROOKS[Color.WHITE] || to === Q_ROOKS[Color.WHITE])
      newRights &= ~CastlingRights.WHITE_QUEENSIDE;
    if (from === K_ROOKS[Color.BLACK] || to === K_ROOKS[Color.BLACK])
      newRights &= ~CastlingRights.BLACK_KINGSIDE;
    if (from === Q_ROOKS[Color.BLACK] || to === Q_ROOKS[Color.BLACK])
      newRights &= ~CastlingRights.BLACK_QUEENSIDE;

    this.board.updateHashCastling(oldCastling, newRights);

    // Update Clocks
    if (movingPiece.piece === PieceType.PAWN || Move.isCapture(move)) {
      this.board.halfMoveClock = 0;
    } else {
      this.board.halfMoveClock++;
    }

    if (side === Color.BLACK) {
      this.board.fullMoveNumber++;
    }

    this.board.sideToMove = opp;
    this.board.updateHashSide();

    // Check legality: King cannot be left in check
    const kSq = getLSB(this.board.getPieceBitboard(side, PieceType.KING));
    if (MoveGenerator.isSquareAttacked(this.board, kSq, opp)) {
      this.undoMoveInternal(
        move,
        from,
        to,
        flags,
        side,
        movingPiece.piece,
        capturedPiece,
        oldEp,
        oldCastling,
        oldHalfMove,
      );
      return false;
    }

    this.history.push({
      move,
      castlingRights: newRights,
      enPassantSquare: newEp,
      halfMoveClock: this.board.halfMoveClock,
      hashKey: this.board.hashKey,
      capturedPiece,
    });

    return true;
  }

  public undoMove() {
    const record = this.history.pop();
    if (!record || record.move === 0) return; // Cannot undo start state

    const prevRecord = this.history.peek()!;
    const move = record.move;
    const from = Move.getFrom(move);
    const to = Move.getTo(move);
    const flags = Move.getFlags(move);
    const side = this.board.sideToMove ^ 1;

    let movingPieceType = this.board.getPieceAt(to)!.piece;
    if (Move.isPromotion(move)) movingPieceType = PieceType.PAWN;

    this.undoMoveInternal(
      move,
      from,
      to,
      flags,
      side,
      movingPieceType,
      record.capturedPiece,
      prevRecord.enPassantSquare,
      prevRecord.castlingRights,
      prevRecord.halfMoveClock,
    );
  }

  private undoMoveInternal(
    move: number,
    from: number,
    to: number,
    flags: MoveFlags,
    side: Color,
    movingPieceType: PieceType,
    capturedPiece: number,
    oldEp: number,
    oldCastling: number,
    oldHalfMove: number,
  ) {
    const opp = side ^ 1;

    // Revert turn and counters
    this.board.sideToMove = side;
    this.board.updateHashSide();
    if (side === Color.BLACK) this.board.fullMoveNumber--;
    this.board.halfMoveClock = oldHalfMove;

    this.board.updateHashEnPassant(this.board.enPassantSquare, oldEp);
    this.board.updateHashCastling(this.board.castlingRights, oldCastling);

    // Un-move piece
    if (Move.isPromotion(move)) {
      this.board.removePiece(to, side, Move.getPromotedPiece(move));
    } else {
      this.board.removePiece(to, side, movingPieceType);
    }
    this.board.addPiece(from, side, movingPieceType);

    // Un-capture
    if (capturedPiece !== -1) {
      if (flags === MoveFlags.EP_CAPTURE) {
        const capSq = side === Color.WHITE ? to - 8 : to + 8;
        this.board.addPiece(capSq, opp, PieceType.PAWN);
      } else {
        this.board.addPiece(to, opp, capturedPiece);
      }
    }

    // Un-castle
    if (flags === MoveFlags.KING_CASTLE) {
      if (side === Color.WHITE) {
        this.board.removePiece(5, Color.WHITE, PieceType.ROOK);
        this.board.addPiece(7, Color.WHITE, PieceType.ROOK);
      } else {
        this.board.removePiece(61, Color.BLACK, PieceType.ROOK);
        this.board.addPiece(63, Color.BLACK, PieceType.ROOK);
      }
    } else if (flags === MoveFlags.QUEEN_CASTLE) {
      if (side === Color.WHITE) {
        this.board.removePiece(3, Color.WHITE, PieceType.ROOK);
        this.board.addPiece(0, Color.WHITE, PieceType.ROOK);
      } else {
        this.board.removePiece(59, Color.BLACK, PieceType.ROOK);
        this.board.addPiece(56, Color.BLACK, PieceType.ROOK);
      }
    }
  }
}

function getLSB(bitboard: bigint): number {
  if (bitboard === 0n) return -1;
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

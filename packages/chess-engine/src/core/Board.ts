import { Color, PieceType } from '../constants/Enums';
import { Square } from '../constants/Squares';
import { EMPTY_BB, checkBit, clearBit, setBit } from '../constants/Bitboards';
import { ZOBRIST_CASTLING, ZOBRIST_EN_PASSANT, ZOBRIST_PIECES, ZOBRIST_SIDE } from './Zobrist';

export class Board {
  public pieces: bigint[]; // [whitePawns, ..., blackKing] mapped by color * 6 + pieceType
  public colors: bigint[]; // [whitePieces, blackPieces]
  public allPieces: bigint;
  
  public castlingRights: number;
  public enPassantSquare: number; // Square enum or Square.NONE
  public halfMoveClock: number;
  public fullMoveNumber: number;
  public sideToMove: Color;
  public hashKey: bigint;

  constructor() {
    this.pieces = new Array(12).fill(EMPTY_BB);
    this.colors = new Array(2).fill(EMPTY_BB);
    this.allPieces = EMPTY_BB;
    this.castlingRights = 0;
    this.enPassantSquare = Square.NONE;
    this.halfMoveClock = 0;
    this.fullMoveNumber = 1;
    this.sideToMove = Color.WHITE;
    this.hashKey = EMPTY_BB;
  }

  public getPieceBitboard(color: Color, piece: PieceType): bigint {
    return this.pieces[color * 6 + piece];
  }

  public addPiece(square: number, color: Color, piece: PieceType) {
    const pIdx = color * 6 + piece;
    this.pieces[pIdx] = setBit(this.pieces[pIdx], square);
    this.colors[color] = setBit(this.colors[color], square);
    this.allPieces = setBit(this.allPieces, square);
    this.hashKey ^= ZOBRIST_PIECES[color][piece][square];
  }

  public removePiece(square: number, color: Color, piece: PieceType) {
    const pIdx = color * 6 + piece;
    this.pieces[pIdx] = clearBit(this.pieces[pIdx], square);
    this.colors[color] = clearBit(this.colors[color], square);
    this.allPieces = clearBit(this.allPieces, square);
    this.hashKey ^= ZOBRIST_PIECES[color][piece][square];
  }

  public getPieceAt(square: number): { color: Color; piece: PieceType } | null {
    if (!checkBit(this.allPieces, square)) return null;

    const color = checkBit(this.colors[Color.WHITE], square) ? Color.WHITE : Color.BLACK;
    for (let p = 0; p < 6; p++) {
      if (checkBit(this.pieces[color * 6 + p], square)) {
        return { color, piece: p };
      }
    }
    return null;
  }

  public updateHashSide() {
    this.hashKey ^= ZOBRIST_SIDE;
  }

  public updateHashCastling(oldRights: number, newRights: number) {
    this.hashKey ^= ZOBRIST_CASTLING[oldRights];
    this.hashKey ^= ZOBRIST_CASTLING[newRights];
    this.castlingRights = newRights;
  }

  public updateHashEnPassant(oldEp: number, newEp: number) {
    if (oldEp !== Square.NONE) {
      const file = oldEp % 8;
      this.hashKey ^= ZOBRIST_EN_PASSANT[file];
    }
    if (newEp !== Square.NONE) {
      const file = newEp % 8;
      this.hashKey ^= ZOBRIST_EN_PASSANT[file];
    }
    this.enPassantSquare = newEp;
  }
}

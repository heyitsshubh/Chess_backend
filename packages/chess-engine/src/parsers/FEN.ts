import { Board } from '../core/Board';
import { Color, PieceType, CastlingRights } from '../constants/Enums';
import { Square, squareToIndex, SQUARE_NAMES } from '../constants/Squares';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const CHAR_TO_PIECE: Record<string, { color: Color; piece: PieceType }> = {
  P: { color: Color.WHITE, piece: PieceType.PAWN },
  N: { color: Color.WHITE, piece: PieceType.KNIGHT },
  B: { color: Color.WHITE, piece: PieceType.BISHOP },
  R: { color: Color.WHITE, piece: PieceType.ROOK },
  Q: { color: Color.WHITE, piece: PieceType.QUEEN },
  K: { color: Color.WHITE, piece: PieceType.KING },
  p: { color: Color.BLACK, piece: PieceType.PAWN },
  n: { color: Color.BLACK, piece: PieceType.KNIGHT },
  b: { color: Color.BLACK, piece: PieceType.BISHOP },
  r: { color: Color.BLACK, piece: PieceType.ROOK },
  q: { color: Color.BLACK, piece: PieceType.QUEEN },
  k: { color: Color.BLACK, piece: PieceType.KING },
};

const PIECE_TO_CHAR = ['P', 'N', 'B', 'R', 'Q', 'K'];

export class FEN {
  static parse(fen: string, board: Board): void {
    const parts = fen.split(' ');
    if (parts.length !== 6) throw new Error('Invalid FEN string');

    const [pieces, side, castling, enPassant, halfMove, fullMove] = parts;

    // 1. Clear current board
    board.pieces.fill(0n);
    board.colors.fill(0n);
    board.allPieces = 0n;
    board.hashKey = 0n;

    // 2. Parse Pieces
    let rank = 7;
    let file = 0;
    for (let i = 0; i < pieces.length; i++) {
      const char = pieces[i];
      if (char === '/') {
        rank--;
        file = 0;
      } else if (/\d/.test(char)) {
        file += parseInt(char, 10);
      } else {
        const p = CHAR_TO_PIECE[char];
        if (!p) throw new Error(`Invalid piece character in FEN: ${char}`);
        board.addPiece(rank * 8 + file, p.color, p.piece);
        file++;
      }
    }

    // 3. Side to move
    board.sideToMove = side === 'w' ? Color.WHITE : Color.BLACK;
    if (board.sideToMove === Color.BLACK) {
      board.updateHashSide();
    }

    // 4. Castling Rights
    let rights = 0;
    if (castling !== '-') {
      if (castling.includes('K')) rights |= CastlingRights.WHITE_KINGSIDE;
      if (castling.includes('Q')) rights |= CastlingRights.WHITE_QUEENSIDE;
      if (castling.includes('k')) rights |= CastlingRights.BLACK_KINGSIDE;
      if (castling.includes('q')) rights |= CastlingRights.BLACK_QUEENSIDE;
    }
    board.updateHashCastling(board.castlingRights, rights);

    // 5. En Passant
    const epSquare = enPassant === '-' ? Square.NONE : squareToIndex(enPassant);
    board.updateHashEnPassant(board.enPassantSquare, epSquare);

    // 6. Move counters
    board.halfMoveClock = parseInt(halfMove, 10);
    board.fullMoveNumber = parseInt(fullMove, 10);
  }

  static stringify(board: Board): string {
    let fen = '';
    
    // 1. Pieces
    for (let rank = 7; rank >= 0; rank--) {
      let empty = 0;
      for (let file = 0; file < 8; file++) {
        const sq = rank * 8 + file;
        const p = board.getPieceAt(sq);
        if (p) {
          if (empty > 0) {
            fen += empty.toString();
            empty = 0;
          }
          let char = PIECE_TO_CHAR[p.piece];
          if (p.color === Color.BLACK) char = char.toLowerCase();
          fen += char;
        } else {
          empty++;
        }
      }
      if (empty > 0) fen += empty.toString();
      if (rank > 0) fen += '/';
    }

    // 2. Side
    fen += ` ${board.sideToMove === Color.WHITE ? 'w' : 'b'}`;

    // 3. Castling
    let castling = '';
    if (board.castlingRights & CastlingRights.WHITE_KINGSIDE) castling += 'K';
    if (board.castlingRights & CastlingRights.WHITE_QUEENSIDE) castling += 'Q';
    if (board.castlingRights & CastlingRights.BLACK_KINGSIDE) castling += 'k';
    if (board.castlingRights & CastlingRights.BLACK_QUEENSIDE) castling += 'q';
    fen += ` ${castling || '-'}`;

    // 4. En Passant
    fen += ` ${board.enPassantSquare === Square.NONE ? '-' : SQUARE_NAMES[board.enPassantSquare]}`;

    // 5 & 6. Counters
    fen += ` ${board.halfMoveClock} ${board.fullMoveNumber}`;

    return fen;
  }
}

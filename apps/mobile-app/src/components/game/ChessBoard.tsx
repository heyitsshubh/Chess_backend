// ============================================================
// ChessBoard Component
//
// A beautiful interactive chessboard.
// Parses FEN, renders pieces with tap-to-select-and-move.
// Highlights selected squares and valid move targets.
// ============================================================
import React, { useCallback } from 'react';
import { View, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useGameStore } from '@/store/gameStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
export const BOARD_SIZE = SCREEN_WIDTH - 32;
const SQUARE_SIZE = BOARD_SIZE / 8;

// Unicode chess piece mapping
const PIECE_UNICODE: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

const PIECE_COLORS: Record<string, string> = {
  K: '#FFFFFF', Q: '#FFFFFF', R: '#FFFFFF', B: '#FFFFFF', N: '#FFFFFF', P: '#FFFFFF',
  k: '#1a1a2e', q: '#1a1a2e', r: '#1a1a2e', b: '#1a1a2e', n: '#1a1a2e', p: '#1a1a2e',
};

// Parse FEN string into a flat 64-element board array (index 0 = a8, 63 = h1)
function parseFen(fen: string): (string | null)[] {
  const board: (string | null)[] = new Array(64).fill(null);
  const fenBoard = fen.split(' ')[0];
  let idx = 0;
  for (const char of fenBoard) {
    if (char === '/') continue;
    if (!isNaN(Number(char))) {
      idx += Number(char);
    } else {
      board[idx++] = char;
    }
  }
  return board;
}

interface CellProps {
  index: number;
  piece: string | null;
  isLight: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  onPress: (index: number) => void;
  flipped: boolean;
}

function BoardCell({ index, piece, isLight, isSelected, isValidMove, onPress }: CellProps) {
  const bg = isSelected
    ? '#20B2AA'
    : isValidMove
    ? isLight ? '#cdd26a' : '#aaa23a'
    : isLight
    ? '#F0D9B5'
    : '#B58863';

  return (
    <TouchableOpacity
      onPress={() => onPress(index)}
      activeOpacity={0.85}
      style={{
        width: SQUARE_SIZE,
        height: SQUARE_SIZE,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isValidMove && !piece && (
        <View
          style={{
            width: SQUARE_SIZE * 0.28,
            height: SQUARE_SIZE * 0.28,
            borderRadius: SQUARE_SIZE,
            backgroundColor: 'rgba(0,0,0,0.2)',
          }}
        />
      )}
      {piece && (
        <Text
          style={{
            fontSize: SQUARE_SIZE * 0.7,
            color: PIECE_COLORS[piece],
            textShadowColor: piece === piece.toUpperCase() ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
            lineHeight: SQUARE_SIZE * 0.88,
          }}
        >
          {PIECE_UNICODE[piece]}
        </Text>
      )}
    </TouchableOpacity>
  );
}

interface Props {
  fen: string;
  myColor: 'white' | 'black';
  onMove: (from: number, to: number) => void;
  isMyTurn: boolean;
}

export function ChessBoard({ fen, myColor, onMove, isMyTurn }: Props) {
  const selectedSquare = useGameStore((s) => s.selectedSquare);
  const validMoves = useGameStore((s) => s.validMoves);
  const selectSquare = useGameStore((s) => s.selectSquare);
  const setValidMoves = useGameStore((s) => s.setValidMoves);

  const board = parseFen(fen);
  const flipped = myColor === 'black';

  // Compute display order — flip if playing as black
  const indices = flipped
    ? Array.from({ length: 64 }, (_, i) => 63 - i)
    : Array.from({ length: 64 }, (_, i) => i);

  const handlePress = useCallback(
    (index: number) => {
      if (!isMyTurn) return;

      if (selectedSquare === null) {
        // Select a piece
        const piece = board[index];
        if (!piece) return;
        const isMyPiece =
          myColor === 'white' ? piece === piece.toUpperCase() : piece === piece.toLowerCase();
        if (!isMyPiece) return;
        selectSquare(index);
        // TODO: Compute valid moves from engine for this square
        setValidMoves([]);
      } else {
        // Either move or re-select
        if (index === selectedSquare) {
          selectSquare(null);
          setValidMoves([]);
          return;
        }
        const piece = board[index];
        const isMyPiece =
          piece &&
          (myColor === 'white' ? piece === piece.toUpperCase() : piece === piece.toLowerCase());
        if (isMyPiece) {
          selectSquare(index);
          setValidMoves([]);
          return;
        }
        onMove(selectedSquare, index);
        selectSquare(null);
        setValidMoves([]);
      }
    },
    [selectedSquare, board, myColor, isMyTurn, onMove]
  );

  return (
    <View
      style={{
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        borderRadius: 4,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#7B61FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      }}
    >
      {Array.from({ length: 8 }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {Array.from({ length: 8 }, (_, col) => {
            const displayIndex = indices[row * 8 + col];
            const actualRow = Math.floor(displayIndex / 8);
            const actualCol = displayIndex % 8;
            const isLight = (actualRow + actualCol) % 2 === 0;
            const piece = board[displayIndex];
            return (
              <BoardCell
                key={col}
                index={displayIndex}
                piece={piece}
                isLight={isLight}
                isSelected={selectedSquare === displayIndex}
                isValidMove={validMoves.includes(displayIndex)}
                onPress={handlePress}
                flipped={flipped}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

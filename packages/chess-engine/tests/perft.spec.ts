import { describe, it, expect } from 'vitest';
import { ChessGame } from '../src/game/ChessGame';

function perft(game: ChessGame, depth: number): number {
  if (depth === 0) return 1;

  let nodes = 0;
  const moves = game.generateLegalMoves();

  for (const move of moves) {
    if (game.makeMove(move)) {
      nodes += perft(game, depth - 1);
      game.undoMove();
    }
  }

  return nodes;
}

describe('Chess Engine Correctness (Perft)', () => {
  it('Should generate correct node counts for the starting position', () => {
    const game = new ChessGame();
    // Depth 1: 20
    expect(perft(game, 1)).toBe(20);
    // Depth 2: 400
    expect(perft(game, 2)).toBe(400);
    // Depth 3: 8902
    expect(perft(game, 3)).toBe(8902);
    // Depth 4: 197281 (Uncomment to run, takes a bit of time)
    // expect(perft(game, 4)).toBe(197281);
  });

  it('Should generate correct node counts for Kiwipete (Position 2)', () => {
    const game = new ChessGame('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
    expect(perft(game, 1)).toBe(48);
    expect(perft(game, 2)).toBe(2039);
    expect(perft(game, 3)).toBe(97862);
  });
});

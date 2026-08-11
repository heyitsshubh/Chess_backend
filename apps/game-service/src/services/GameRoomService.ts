// ============================================================
// Game Room Service
//
// Manages the state of active games in Redis.
// Utilizes @chess/engine to validate moves on the backend.
// ============================================================
import { Redis } from "ioredis";
import { ChessGame, START_FEN, MoveGenerator, Move } from "@chess/engine";
import { ActiveGame, PlayerSession, TimeControl } from "../core/types";
import { PrismaClient } from "../generated/prisma";
import { logger } from "@chess/logger";

export class GameRoomService {
  constructor(
    private readonly redis: Redis,
    private readonly prisma: PrismaClient,
  ) {}

  // Parse time control (e.g. '3|0' -> 3 mins = 180,000 ms)
  private parseTimeControl(tc: TimeControl): number {
    const [mins] = tc.split("|");
    return parseInt(mins) * 60 * 1000;
  }

  async createGame(
    gameId: string,
    p1: PlayerSession,
    p2: PlayerSession,
    tc: TimeControl,
  ): Promise<ActiveGame> {
    // Randomly assign colors (true = p1 is white)
    const isP1White = Math.random() > 0.5;
    const white = isP1White ? p1 : p2;
    const black = isP1White ? p2 : p1;

    const timeMs = this.parseTimeControl(tc);

    const activeGame: ActiveGame = {
      gameId,
      white,
      black,
      timeControl: tc,
      fen: START_FEN,
      whiteTime: timeMs,
      blackTime: timeMs,
      lastMoveTimestamp: Date.now(),
      status: "IN_PROGRESS",
    };

    // Store in Redis (1 day TTL to prevent stale games leaking forever)
    await this.redis.set(
      `game:${gameId}`,
      JSON.stringify(activeGame),
      "EX",
      86400,
    );

    // Create DB record
    await this.prisma.game.create({
      data: {
        id: gameId,
        whitePlayerId: white.userId,
        blackPlayerId: black.userId,
        timeControl: tc,
        status: "IN_PROGRESS",
      },
    });

    return activeGame;
  }

  async getGame(gameId: string): Promise<ActiveGame | null> {
    const data = await this.redis.get(`game:${gameId}`);
    return data ? JSON.parse(data) : null;
  }

  async makeMove(
    gameId: string,
    userId: string,
    encodedMove: number,
  ): Promise<{
    valid: boolean;
    game?: ActiveGame;
    status?: "IN_PROGRESS" | "CHECKMATE" | "STALEMATE";
    winner?: "WHITE" | "BLACK";
  }> {
    const game = await this.getGame(gameId);
    if (!game || game.status !== "IN_PROGRESS") return { valid: false };

    // Instantiate engine with current FEN
    const chess = new ChessGame(game.fen);
    const sideToMove = chess.board.sideToMove; // 0 = White, 1 = Black

    // Verify it's the correct user's turn
    const expectedUserId =
      sideToMove === 0 ? game.white.userId : game.black.userId;
    if (userId !== expectedUserId) return { valid: false };

    // Verify move legality
    const legalMoves = chess.generateLegalMoves();
    if (!legalMoves.includes(encodedMove)) return { valid: false };

    // Update clocks
    const now = Date.now();
    const elapsed = now - game.lastMoveTimestamp;
    if (sideToMove === 0) {
      game.whiteTime -= elapsed;
      if (game.whiteTime <= 0) game.whiteTime = 0; // Flag fallen handled elsewhere
    } else {
      game.blackTime -= elapsed;
      if (game.blackTime <= 0) game.blackTime = 0;
    }
    game.lastMoveTimestamp = now;

    // Make move in engine
    chess.makeMove(encodedMove);
    game.fen = chess.getFen();

    // Check for mate/stalemate
    const nextLegalMoves = chess.generateLegalMoves();
    let matchStatus: "IN_PROGRESS" | "CHECKMATE" | "STALEMATE" = "IN_PROGRESS";
    let winner: "WHITE" | "BLACK" | undefined;

    if (nextLegalMoves.length === 0) {
      // Is king in check?
      const kingSq = chess.board.getPieceBitboard(
        chess.board.sideToMove,
        5 /* KING */,
      );
      const isCheck = MoveGenerator.isSquareAttacked(
        chess.board,
        getLSB(kingSq),
        chess.board.sideToMove ^ 1,
      );

      if (isCheck) {
        matchStatus = "CHECKMATE";
        winner = sideToMove === 0 ? "WHITE" : "BLACK";
      } else {
        matchStatus = "STALEMATE";
      }
    }

    // Save updated state to Redis
    if (matchStatus !== "IN_PROGRESS") {
      game.status = "COMPLETED";
      await this.endGame(gameId, game, matchStatus, winner);
    } else {
      await this.redis.set(`game:${gameId}`, JSON.stringify(game), "EX", 86400);
    }

    return { valid: true, game, status: matchStatus, winner };
  }

  private async endGame(
    gameId: string,
    game: ActiveGame,
    reason: string,
    winner?: "WHITE" | "BLACK",
  ) {
    await this.redis.del(`game:${gameId}`);

    let dbResult = "DRAW";
    if (winner === "WHITE") dbResult = "WHITE_WINS";
    if (winner === "BLACK") dbResult = "BLACK_WINS";

    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: "COMPLETED",
        pgn: game.fen, // simplified: saving FEN instead of full PGN for now
        result: dbResult as any,
        reason: reason as any,
        endedAt: new Date(),
      },
    });
  }

  async resign(
    gameId: string,
    resigningUserId: string,
  ): Promise<ActiveGame | null> {
    const game = await this.getGame(gameId);
    if (!game || game.status !== "IN_PROGRESS") return null;

    const winner = game.white.userId === resigningUserId ? "BLACK" : "WHITE";
    game.status = "COMPLETED";
    await this.endGame(gameId, game, "RESIGNATION", winner);

    return game;
  }
}

// Helper for bitboard processing
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

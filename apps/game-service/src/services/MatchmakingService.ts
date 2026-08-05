// ============================================================
// Matchmaking Service
//
// Uses Redis Sets to queue players seeking a match. 
// For simplicity, we use one Set per time control. When a player
// joins, we check if someone is already waiting. If yes, pop them
// and create a match. If no, add the current player to the waitlist.
// ============================================================
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { MatchmakingRequest, TimeControl, PlayerSession } from '../core/types';
import { logger } from '@chess/logger';

export class MatchmakingService {
  constructor(private readonly redis: Redis) {}

  /**
   * Attempts to find a match for the user.
   * If a match is found, returns the opponent and a generated gameId.
   * If no match, adds user to queue and returns null.
   */
  async joinQueue(req: MatchmakingRequest): Promise<{ gameId: string; opponent: PlayerSession } | null> {
    const queueKey = `matchmaking:${req.timeControl}`;
    const userPayload = JSON.stringify({
      userId: req.userId,
      username: req.username,
      socketId: req.socketId,
    });

    // We use a Redis MULTI transaction to ensure atomic pop
    // We try to pop an existing player from the set
    const waitingPlayerRaw = await this.redis.spop(queueKey);

    if (waitingPlayerRaw) {
      const waitingPlayer = JSON.parse(waitingPlayerRaw) as PlayerSession;

      // Ensure a user doesn't match with themselves
      if (waitingPlayer.userId === req.userId) {
        // Put them back
        await this.redis.sadd(queueKey, waitingPlayerRaw);
        return null;
      }

      // Match found!
      const gameId = uuidv4();
      logger.info(
        { gameId, p1: waitingPlayer.userId, p2: req.userId, timeControl: req.timeControl },
        'Match created'
      );

      return {
        gameId,
        opponent: waitingPlayer,
      };
    } else {
      // No one waiting, add to queue
      await this.redis.sadd(queueKey, userPayload);
      logger.info({ userId: req.userId, timeControl: req.timeControl }, 'User joined matchmaking queue');
      return null;
    }
  }

  /**
   * Removes a user from the matchmaking queue.
   */
  async leaveQueue(req: MatchmakingRequest): Promise<void> {
    const queueKey = `matchmaking:${req.timeControl}`;
    const userPayload = JSON.stringify({
      userId: req.userId,
      username: req.username,
      socketId: req.socketId,
    });

    await this.redis.srem(queueKey, userPayload);
    logger.info({ userId: req.userId, timeControl: req.timeControl }, 'User left matchmaking queue');
  }
}

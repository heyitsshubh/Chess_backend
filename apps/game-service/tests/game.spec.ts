import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MatchmakingService } from '../src/services/MatchmakingService';
import Redis from 'ioredis';

vi.mock('ioredis', () => {
  const mockRedis = vi.fn().mockImplementation(() => ({
    sadd: vi.fn(),
    spop: vi.fn(),
    srem: vi.fn(),
  }));
  return {
    default: mockRedis,
    Redis: mockRedis,
  };
});

describe('MatchmakingService', () => {
  let redisMock: any;
  let service: MatchmakingService;

  beforeEach(() => {
    redisMock = new Redis();
    service = new MatchmakingService(redisMock);
  });

  it('should add to queue if no one is waiting', async () => {
    redisMock.spop.mockResolvedValueOnce(null);

    const result = await service.joinQueue({
      userId: 'user1',
      username: 'p1',
      timeControl: '3|0',
      socketId: 'sock1'
    });

    expect(result).toBeNull();
    expect(redisMock.sadd).toHaveBeenCalled();
  });

  it('should match players if someone is waiting', async () => {
    const p1Payload = JSON.stringify({ userId: 'user1', username: 'p1', socketId: 'sock1' });
    redisMock.spop.mockResolvedValueOnce(p1Payload);

    const result = await service.joinQueue({
      userId: 'user2',
      username: 'p2',
      timeControl: '3|0',
      socketId: 'sock2'
    });

    expect(result).not.toBeNull();
    expect(result?.opponent.userId).toBe('user1');
    expect(result?.gameId).toBeDefined();
  });
});

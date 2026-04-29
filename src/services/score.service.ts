import { redisClient } from '../repositories/cache/redis.client.js';
import type { Action } from '../types/action.type.js';

export type Player = {
  id: number;
  skillLevel: number;
  name: string;
}

export class ScoreService {

  async updateHistoryToRedis(matchId: string, gameNo: number, history: Action[]) {
    await redisClient.set(`game:${matchId}:${gameNo}`, JSON.stringify(history));
  }
}

// シングルトンとしてエクスポート
export const scoreService = new ScoreService();
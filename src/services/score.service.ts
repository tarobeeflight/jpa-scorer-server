// src/services/media.service.ts
import { mysqlClient } from '../repositories/database/mysql.client.js';
import { redisClient } from '../repositories/cache/redis.client.js';
import type { Action } from '../types/action.type.js';

export type Player = {
  id: number;
  skillLevel: number;
  name: string;
}

export class ScoreService {

  async updateActionHistory({matchId, gameNo, history}: { matchId: string, gameNo: number, history: Action[] }) {
    await redisClient.set(`game:${matchId}:${gameNo}`, JSON.stringify(history));
    const historyStr = await redisClient.get(`game:${matchId}:${gameNo}`);
    console.log('history: ', historyStr);
  }
}

// シングルトンとしてエクスポート
export const scoreService = new ScoreService();
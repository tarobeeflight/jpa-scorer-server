// src/services/media.service.ts
import { mysqlClient } from '../repositories/database/mysql.client.js';
import { redisClient } from '../repositories/cache/redis.client.js';

export type Player = {
  id: number;
  skillLevel: number;
  name: string;
}

export class ScoreService {
  async getPlayer(id: number) {
    const sql = 'SELECT * FROM test_members WHERE id = ?';
    const result = await mysqlClient.execute<Player[]>(sql, [id]);
    return result[0] ?? null;
  }

  async setPlayerSkillLevelToRedis(id: number, skillLevel: number) {
    await redisClient.set(`player:${id}:skillLevel`, skillLevel.toString());
    const skillLevelFromRedis = await redisClient.get(`player:${id}:skillLevel`);
    return skillLevelFromRedis;
  }
}

// シングルトンとしてエクスポート
export const scoreService = new ScoreService();
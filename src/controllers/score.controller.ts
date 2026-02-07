// src/controllers/score.controller.ts
import type { Request, Response } from 'express';
import { scoreService } from '../services/score.service.js';

export class ScoreController {
  async getPlayer(req: Request, res: Response) {
    try {
      const id = 1;

      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }

      // Service層のメソッドを呼び出し
      const player = await scoreService.getPlayer(id);

      // redisの接続確認
      const skillLevelFromRedis = await scoreService.setPlayerSkillLevelToRedis(id, 9);

      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      return res.json({ ...player, skillLevel: skillLevelFromRedis });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

export const scoreController = new ScoreController();
// src/controllers/score.controller.ts
import type { Request, Response } from 'express';
import { scoreService } from '../services/score.service.js';

export class ScoreController {
  async updateActionHistory(req: Request, res: Response) {
      try {
        console.log('req: ', req.body);
  
        // 登録
        await scoreService.updateActionHistory(req.body);
  
        return res.json({ message: 'Score history updated successfully' });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    }
}

export const scoreController = new ScoreController();
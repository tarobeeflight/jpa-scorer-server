// src/controllers/score.controller.ts
import type { Request, Response } from 'express';
import { playerService } from '../services/player.service.js';

export class PlayerController {
  async register(req: Request, res: Response) {
    try {
      console.log('req: ', req.body);

      // 登録
      await playerService.resister(req.body);

      return res.json({ message: 'Player registered successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

export const playerController = new PlayerController();
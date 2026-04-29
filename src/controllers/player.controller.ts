// src/controllers/score.controller.ts
import type { Request, Response } from 'express';
import { playerService } from '../services/player.service.js';
import { BaseController } from './base.controller.js';

export class PlayerController extends BaseController {
  async register(req: Request, res: Response) {
    try {
      console.log('req: ', req.body);

      // 登録
      await playerService.register(req.body);

      const response = this.createResponse('success', 'Player registered successfully', undefined);
      return res.json(response);
    } catch (error) {
      console.error(error);
      const response = this.createResponse('error', 'Internal Server Error', undefined);
      return res.status(500).json(response);
    }
  }
}

export const playerController = new PlayerController();
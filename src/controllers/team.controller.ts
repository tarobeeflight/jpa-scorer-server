import type { Request, Response } from 'express';
import { BaseController } from './base.controller.js';
import { teamService } from '../services/team.service.js';

export class TeamController extends BaseController {
  // HTTP API
  async get(req: Request, res: Response) {
    try {
      // 取得
      const teams = await teamService.get();

      const response = this.createResponse('success', 'Teams retrieved successfully', teams);
      return res.json(response);
    } catch (error) {
      console.error(error);
      const response = this.createResponse('error', 'Internal Server Error', undefined);
      return res.status(500).json(response);
    }
  }
}

export const teamController = new TeamController();
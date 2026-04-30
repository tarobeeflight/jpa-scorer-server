// src/controllers/score.controller.ts
import type { Request, Response } from 'express';
import { playerService } from '../services/player.service.js';
import { BaseController } from './base.controller.js';

export class PlayerController extends BaseController {

}

export const playerController = new PlayerController();
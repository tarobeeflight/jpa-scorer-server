import type { Request, Response } from 'express';
import { matchService } from '../services/match.service.js';
import { BaseController } from './base.controller.js';
import type { Match } from '../types/match.type.js';
import type { Server, Socket } from 'socket.io';
import type { GameRoomSocketRequest } from '../types/requests/game-room.socket.resuest.js';
import { codeService } from '../services/code.service.js';
import type { PlayerInfoInitResponse } from '../types/responses/player-info-init.http.response.js';
import type { GameUpdatePlayerRequest } from '../types/requests/game-update-player.http.request.js';

export class MatchController extends BaseController {
  // ---------------------------------------------------
  // HTTP API
  // ---------------------------------------------------
  /**
   * 試合リストを取得する
   * @param req 
   * @param res 
   * @returns 
   */
  async getMatchList(req: Request, res: Response) {
    try {
      // 取得
      const matches = await matchService.getMatchList([]);

      const response = this.createResponse('success', 'Matches retrieved successfully', matches);
      return res.json(response);
    } catch (error) {
      console.error(error);
      const response = this.createResponse('error', 'Internal Server Error', undefined);
      return res.status(500).json(response);
    }
  }

  /**
   * プレイヤー情報画面の初期表示用のデータを取得する
   * パスパラメータで指定した対戦、コードマスタのSKILL_LEVEL_TO_GOALを取得する
   * @param req 
   * @param res 
   * @returns 
   */
  async getPlayerInfoInit(req: Request, res: Response) {
    try {
      // 取得
      const game = await matchService.getGame(req.params.matchId as string, Number(req.params.gameNo));
      const codeList = await codeService.get('SKILL_LEVEL_TO_GOAL');

      // コードマスタをMapもどきに変換
      // MapだとJSONにシリアライズできないため、オブジェクトで代用する。todo : いつか汎用クラスを作る。
      const skillToGoal: { [key: number]: number } = {};
      codeList.forEach(code => {
        skillToGoal[Number(code.code1)] = Number(code.code2);
      });

      // データ成形
      const data: PlayerInfoInitResponse = { game, skillToGoal };
      const response = this.createResponse('success', 'Game retrieved successfully', data);

      console.log('getPlayerInfoInit response:', response);

      return res.json(response);
    } catch (error) {
      console.error(error);
      const response = this.createResponse('error', 'Internal Server Error', undefined);
      return res.status(500).json(response);
    }
  }

  /**
   * 試合情報をDBに登録する
   * 登録した試合をブロードキャストする
   * @param req 
   * @param res 
   * @returns 
   */
  async create(req: Request, res: Response, io: Server) {
    try {
      // HTTP通信時に文字列変換されてしまうため、日付をDate型に変換
      const m = {
        ...req.body as Partial<Match>,
        matchDay: new Date(req.body.matchDay),
      };
      // 試合・対戦を作成
      const match: Match = await matchService.create(m);

      // 作成した試合をブロードキャスト
      this.broadcastMatchUpdate(io, match);

      const response = this.createResponse('success', 'Match created successfully', undefined);
      return res.json(response);
    } catch (error) {
      console.error(error);
      const response = this.createResponse('error', 'Internal Server Error', undefined);
      return res.status(500).json(response);
    }
  }

  /**
   * 対戦のプレイヤーを登録する
   * 更新した試合をブロードキャストする
   * @param req 
   * @param res 
   * @returns 
   */
  async updatePlayerOnGame(req: Request, res: Response, io: Server) {
    try {    
          // 更新
          const isHaita = await matchService.updatePlayerOnGame(req.body as GameUpdatePlayerRequest);
          
          // todo : 更新した試合をブロードキャスト
    
          const response = this.createResponse('success', 'Game updated for player successfully', isHaita);
          return res.json(response);
        } catch (error) {
          console.error(error);
          const response = this.createResponse('error', 'Internal Server Error', undefined);
          return res.status(500).json(response);
        }
  }


  // ---------------------------------------------------
  // WEB SOCKET API
  // ---------------------------------------------------
  /**
   * サーバー起動時に呼び出し、socketのリッスンを開始する
   * @param socket 
   */
  attachSocketEvents(socket: Socket, io: Server) {
    // 試合一覧ルームへの参加をリッスン
    this.listenJoinMatchList(socket);

    // 試合一覧ルームからの退出をリッスン
    this.listenLeaveMatchList(socket);

    // 対戦ルームへの参加をリッスン
    this.listenJoinGame(socket);

    // 対戦ルームからの退出をリッスン
    this.listenLeaveGame(socket);
  }

  // 試合一覧ルームへの参加をリッスン
  listenJoinMatchList(socket: Socket) {
    socket.on('join-match-list', (_) => {
      socket.join('match-list');
      console.log(`User ${socket.id} joined match-list`);
    });
  }

  // 試合一覧ルームからの退出をリッスン
  listenLeaveMatchList(socket: Socket) {
    socket.on('leave-match-list', (_) => {
      socket.leave('match-list');
      console.log(`User ${socket.id} left matchl-list`);
    });
  }

  // 対戦ルームへの参加をリッスン
  listenJoinGame(socket: Socket) {
    socket.on('join-game', (data: GameRoomSocketRequest) => {
      socket.join(data.matchId + '-' + data.gameNo);
      console.log(`User ${socket.id} joined game: ${data.matchId}-${data.gameNo}`);
    });
  }

  // 対戦ルームからの退出をリッスン
  listenLeaveGame(socket: Socket) {
    socket.on('leave-game', (data: GameRoomSocketRequest) => {
      socket.leave(data.matchId + '-' + data.gameNo);
      console.log(`User ${socket.id} left game: ${data.matchId}-${data.gameNo}`);
    });
  }

  // 試合一覧ルームに試合更新をブロードキャスト
  broadcastMatchUpdate(io: Server, match: Match): void {
    const response = this.createResponse('success', 'broadcast match update', match);
    io.to('match-list').emit('match-list-broadcast', response);
  }

}

export const matchController = new MatchController();
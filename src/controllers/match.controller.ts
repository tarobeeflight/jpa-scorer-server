import type { Request, Response } from 'express';
import { matchService } from '../services/match.service.js';
import { BaseController } from './base.controller.js';
import type { Match } from '../types/match.type.js';
import type { Server, Socket } from 'socket.io';
import type { GameRoomSocketRequest } from '../types/requests/game-room.socket.resuest.js';
import { codeService } from '../services/code.service.js';
import type { PlayerInfoInitResponse } from '../types/responses/player-info-init.http.response.js';
import type { GameUpdatePlayerRequest } from '../types/requests/game-update-player.http.request.js';
import { scoreService } from '../services/score.service.js';
import type { JpaMatchInitResponse } from '../types/responses/jpa-match-init.http.response.js';
import type { UpdateFirstPlayerRequest } from '../types/requests/update-first-player.http.request.js';
import type { UpdateFirstPlayerResponse } from '../types/responses/update-first-player.http.response.js';

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
      const matches = await matchService.getMatchListFromRedis() ?? await matchService.getMatchList([]);

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
   * 対戦画面の初期表示用のデータを取得する
   * パスパラメータで指定した対戦、アクションを取得する
   * @param req 
   * @param res 
   * @returns 
   */
  async getJpaMatchInit(req: Request, res: Response) {
    try {
      const matchId = req.params.matchId as string;
      const gameNo = Number(req.params.gameNo);
      // 取得
      const game = await matchService.getGame(matchId, gameNo);
      let history = await scoreService.getHistoryFromRedis(matchId, gameNo);

      if (!history) {
        history = await scoreService.getHistoryFromDb(matchId, gameNo) ?? [];
        // DBのアクション履歴でredisに登録
        await scoreService.updateHistoryToRedis(matchId, gameNo, history);
      }


      // データ成形
      const data: JpaMatchInitResponse = { game, history};
      const response = this.createResponse('success', 'jpa-match init successfully', data);

      console.log('getJpaMatchInit response:', response);

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
        matchDay: new Date(req.body.matchDay), // todo : 要確認。match.service.ts > updatePlayerOnGame > startDtと同様の問題があるかも。日付単位やから気づかんかったか？
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
          const {isHaita, match} = await matchService.updatePlayerOnGame(req.body as GameUpdatePlayerRequest);
          
          // 更新した試合をブロードキャスト
          if (!isHaita) {
            this.broadcastMatchUpdate(io, match!);
          }
    
          const response = this.createResponse('success', 'Game updated for player successfully', isHaita);
          return res.json(response);
        } catch (error) {
          console.error(error);
          const response = this.createResponse('error', 'Internal Server Error', undefined);
          return res.status(500).json(response);
        }
  }

  /**
   * 対戦の先攻プレイヤーを登録する
   * @param req 
   * @param res 
   * @returns 
   */
  async updateFirstPlayerOnGame(req: Request, res: Response) {
    try {    
          // 更新
          const reqData = req.body as UpdateFirstPlayerRequest;
          const { isHaita } = await matchService.updateFirstPlayerOnGame(reqData);
    
          let resData: UpdateFirstPlayerResponse;
          if (isHaita) {
            const game = await matchService.getGame(reqData.matchId, reqData.gameNo);
            resData = { isHaita: true, firstPlayerKbn:  game!.firstPlayerKbn};
          } else {
            resData = { isHaita: false, firstPlayerKbn: reqData.firstPlayerKbn };
          }
          const response = this.createResponse('success', 'Game updated for first player successfully', resData);
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
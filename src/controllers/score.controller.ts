import { scoreService } from '../services/score.service.js';
import { BaseController } from './base.controller.js';
import type { UpdateScoreSocketRequest } from '../types/requests/update-score.socket.request.js';
import type { Server, Socket } from 'socket.io';
import type { Action } from '../types/action.type.js';
import { matchController } from './match.controller.js';
import { matchService } from '../services/match.service.js';
import { appUtil } from '../utils/app.util.js';

export class ScoreController extends BaseController {
    // ---------------------------------------------------
    // HTTP API
    // ---------------------------------------------------
    // todo : 対戦終了時にDBにアクションを登録するメソッドに組み替える
    // async registerActionHistory(req: Request, res: Response) {
    //   try {
    //     console.log('req: ', req.body);

    //     // 登録
    //     await scoreService.updateActionHistory(req.body);

    //     const response = this.createResponse('success', 'Score history updated successfully', undefined);
    //     return res.json(response);
    //   } catch (error) {
    //     console.error(error);
    //     const response = this.createResponse('error', 'Internal Server Error', undefined);
    //     return res.status(500).json(response);
    //   }
    // }

    // ---------------------------------------------------
    // WEB SOCKET API
    // ---------------------------------------------------
    /**
     * サーバー起動時に呼び出し、socketのリッスンを開始する
     * @param socket
     * @param io
     */
    attachSocketEvents(socket: Socket, io: Server) {

        // スコア更新イベントの受信
        this.listenUpdateScore(socket, io);
    }

    // スコア更新をリッスン
    listenUpdateScore(socket: Socket, io: Server) {
        socket.on('update-score', async (data: UpdateScoreSocketRequest) => {
            // 履歴をRedisに登録する
            scoreService.updateHistoryToRedis(data.matchId, data.gameNo, data.history);

            // Redisから該当の試合情報を取得する。Redisに存在しない場合、DBから取得する
            const match = await matchService.getMatchFromRedis(data.matchId)
                ?? (await matchService.getMatchList([data.matchId]))!.at(0)!;

            // 引数の履歴情報で更新
            const updatedMatch = appUtil.updateGameInMatch(match, data.gameNo, data.history);

            // Redisに登録
            matchService.updateMatchToRedis(updatedMatch);

            // 同じ対戦ルームにスコア更新を通知
            this.broadcastHistoryUpdate(io, data.matchId, data.gameNo, data.history);

            // 該当対戦の試合ルームに試合更新を通知
            matchController.broadcastMatchUpdate(io, updatedMatch);
        });
    }

    // 該当の対戦ルームにスコア更新をブロードキャスト
    broadcastHistoryUpdate(io: Server, matchId: string, gameNo: number, history: Action[]): void {
        const response = this.createResponse('success', 'broadcast history update', history);
        io.to(matchId + '-' + gameNo).emit('history-broadcast', response);
    }
}

export const scoreController = new ScoreController();
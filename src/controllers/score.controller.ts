import { scoreService } from '../services/score.service.js';
import { BaseController } from './base.controller.js';
import type { UpdateScoreSocketRequest } from '../types/requests/update-score.socket.request.js';
import type { Server, Socket } from 'socket.io';
import type { Action } from '../types/action.type.js';
import { matchController } from './match.controller.js';
import { appUtil } from '../utils/app.util.js';

export class ScoreController extends BaseController {

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
            const reqGame = data.game;

            // 履歴をRedisに登録する
            scoreService.updateHistoryToRedis(reqGame.matchId, reqGame.gameNo, data.history);

            // 同じ対戦ルームにスコア更新を通知
            this.broadcastHistoryUpdate(io, reqGame.matchId, reqGame.gameNo, data.history);

            // 試合一覧ルームに対戦更新を通知
            const updatedGame = appUtil.convertHistoryToGame(reqGame, data.history);
            matchController.broadcastGameUpdate(io, updatedGame);
        });
    }

    // 該当の対戦ルームにスコア更新をブロードキャスト
    broadcastHistoryUpdate(io: Server, matchId: string, gameNo: number, history: Action[]): void {
        const response = this.createResponse('success', 'broadcast history update', history);
        io.to(matchId + '-' + gameNo).emit('history-broadcast', response);
    }
}

export const scoreController = new ScoreController();
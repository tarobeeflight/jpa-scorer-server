import { redisClient } from '../repositories/cache/redis.client.js';
import { MysqlDao } from '../repositories/database/mysql.dao.js';
import type { Action } from '../types/action.type.js';

export type Player = {
  id: number;
  skillLevel: number;
  name: string;
}

export class ScoreService {

  async updateHistoryToRedis(matchId: string, gameNo: number, history: Action[]): Promise<void> {
    await redisClient.set(`game:${matchId}:${gameNo}`, JSON.stringify(history));
  }

  async getHistoryFromRedis(matchId: string, gameNo: number): Promise<Action[] | null> {
    return await redisClient.get<Action[]>(`game:${matchId}:${gameNo}`);
  }

  async getHistoryFromDb(matchId: string, gameNo: number): Promise<Action[] | null> {
    const sql =
      "SELECT /*アクション履歴取得*/ "
      + "    A.match_id, "
      + "    A.game_no, "
      + "    A.action_no, "
      + "    A.action_player_kbn, "
      + "    A.rack, "
      + "    A.inning, "
      + "    A.action_type, "
      + "    A.ball_num "
      + "FROM "
      + "    t_game_action A "
      + "WHERE "
      + "    1 = 1 "
      + "    AND A.match_id = :MATCHID "
      + "    AND A.game_no = :GAMENO "

    const dao = new MysqlDao();

    try {
      // 接続
      await dao.connect();
      // ----------------------------------
      // アクション履歴取得
      // ----------------------------------
      dao.setSql(sql);
      dao.addParam('MATCHID', matchId);
      dao.addParam('GAMENO', gameNo);
      const history = await dao.executeQuery<Action>();
      return history ?? null;
    } catch (error) {
      throw error;
    } finally {
      // 解放
      await dao.release();
    }
  }
}

// シングルトンとしてエクスポート
export const scoreService = new ScoreService();
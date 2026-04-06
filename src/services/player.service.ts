// src/services/media.service.ts
import { mysqlClient } from '../repositories/database/mysql.client.js';
import { redisClient } from '../repositories/cache/redis.client.js';
import { MysqlDao } from '../repositories/database/mysql.dao.js';
import type { Player } from '../types/player.type.js';

export class PlayerService {
    async resister({player1, player2}: { player1: Player; player2: Player }) {
        const sql = 
            'UPDATE t_game SET '
            + '    home_player_id = :HOME_PLAYER_ID, home_jpa_player_no = :HOME_JPA_PLAYER_NO, '
            + '    home_player_nm = :HOME_PLAYER_NM, home_skill_level = :HOME_SKILL_LEVEL, '
            + '    home_shozoku_team_id = :HOME_SHOZOKU_TEAM_ID, home_goal = :HOME_GOAL, '
            + '    visitor_player_id = :VISITOR_PLAYER_ID, visitor_jpa_player_no = :VISITOR_JPA_PLAYER_NO, '
            + '    visitor_player_nm = :VISITOR_PLAYER_NM, visitor_skill_level = :VISITOR_SKILL_LEVEL, '
            + '    visitor_shozoku_team_id = :VISITOR_SHOZOKU_TEAM_ID, visitor_goal = :VISITOR_GOAL '
            + 'WHERE match_id = :MATCH_ID AND game_no = :GAME_NO';

        const dao = new MysqlDao();

        try {
            // 接続
            await dao.connect();
            // SQL・パラメータセット
            dao.setSql(sql);
            // todo : パラメータがテスト用
            dao.addParam('HOME_PLAYER_ID', player1.id);
            dao.addParam('HOME_JPA_PLAYER_NO', '');
            dao.addParam('HOME_PLAYER_NM', player1.name);
            dao.addParam('HOME_SKILL_LEVEL', player1.skillLevel);
            dao.addParam('HOME_SHOZOKU_TEAM_ID', '');
            dao.addParam('HOME_GOAL', player1.goal);
            dao.addParam('VISITOR_PLAYER_ID', player2.id);
            dao.addParam('VISITOR_JPA_PLAYER_NO', '');
            dao.addParam('VISITOR_PLAYER_NM', player2.name);
            dao.addParam('VISITOR_SKILL_LEVEL', player2.skillLevel);
            dao.addParam('VISITOR_SHOZOKU_TEAM_ID', '');
            dao.addParam('VISITOR_GOAL', player2.goal);
            dao.addParam('MATCH_ID', '2026040601');
            dao.addParam('GAME_NO', 1);
            // UPDATE実行
            await dao.executeNonQuery();
            // コミット
            await dao.commit();

        } catch (error) {
            // ロールバック
            await dao.rollback();
            throw error;
        } finally {
            // 解放
            await dao.release();
        }
    }

    // テスト用
    async getPlayer(id: number) {
        const sql = 'SELECT * FROM test_members WHERE id = ?';
        const conn = await mysqlClient.getConnection();
        const result = await mysqlClient.execute<Player[]>(conn, sql, [id]);
        return result[0] ?? null;
    }

    // テスト用
    async setPlayerSkillLevelToRedis(id: number, skillLevel: number) {
        await redisClient.set(`player:${id}:skillLevel`, skillLevel.toString());
        const skillLevelFromRedis = await redisClient.get(`player:${id}:skillLevel`);
        return skillLevelFromRedis;
    }
}

// シングルトンとしてエクスポート
export const playerService = new PlayerService();
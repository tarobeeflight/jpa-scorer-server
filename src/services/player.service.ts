import { MysqlDao } from '../repositories/database/mysql.dao.js';
import type { Player } from '../types/player.type.js';

export class PlayerService {
    async register({ player1, player2 }: { player1: Player; player2: Player }) {
        const sql =
            "UPDATE /*対戦プレイヤー更新*/ "
            + "    t_game "
            + "SET "
            + "    home_player_id = :HOME_PLAYER_ID "
            + "    , home_jpa_player_no = :HOME_JPA_PLAYER_NO "
            + "    , home_player_nm = :HOME_PLAYER_NM "
            + "    , home_skill_level = :HOME_SKILL_LEVEL "
            + "    , home_goal = :HOME_GOAL "
            + "    , visitor_player_id = :VISITOR_PLAYER_ID "
            + "    , visitor_jpa_player_no = :VISITOR_JPA_PLAYER_NO "
            + "    , visitor_player_nm = :VISITOR_PLAYER_NM "
            + "    , visitor_skill_level = :VISITOR_SKILL_LEVEL "
            + "    , visitor_goal = :VISITOR_GOAL "
            + "WHERE "
            + "    match_id = :MATCH_ID "
            + "    AND game_no = :GAME_NO ";

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
            dao.addParam('HOME_GOAL', player1.goal);
            dao.addParam('VISITOR_PLAYER_ID', player2.id);
            dao.addParam('VISITOR_JPA_PLAYER_NO', '');
            dao.addParam('VISITOR_PLAYER_NM', player2.name);
            dao.addParam('VISITOR_SKILL_LEVEL', player2.skillLevel);
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
}

// シングルトンとしてエクスポート
export const playerService = new PlayerService();
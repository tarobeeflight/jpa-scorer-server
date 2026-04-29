import { MysqlDao } from '../repositories/database/mysql.dao.js';
import type { Team } from '../types/team.type.js';

export class TeamService {
    async get(): Promise<Team[]> {
        const sql =
            "SELECT /*チーム取得*/ "
            + "    T.team_id, "
            + "    T.team_no, "
            + "    T.team_nm, "
            + "    T.home_store_id, "
            + "    T.devisition_id "
            + "FROM "
            + "    m_team T "
            + "WHERE "
            + "    1 = 1 ";

        const dao = new MysqlDao();

        try {
            // 接続
            await dao.connect();
            // ----------------------------------
            // 試合取得
            // ----------------------------------
            dao.setSql(sql);
            const teams = await dao.executeQuery<Team>();

            return teams;

        } catch (error) {
            throw error;
        } finally {
            // 解放
            await dao.release();
        }
    }

}

// シングルトンとしてエクスポート
export const teamService = new TeamService();
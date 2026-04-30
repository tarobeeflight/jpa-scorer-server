import { redisClient } from '../repositories/cache/redis.client.js';
import { MysqlDao } from '../repositories/database/mysql.dao.js';
import type { Match } from '../types/match.type.js';
import type { Game } from '../types/game.type.js';
import { DateUtil } from '../utils/date.util.js';
import { sequenceService } from './sequence.service.js';
import { GameStatus, SequenceKbn } from '../constants.js';
import type { GameUpdatePlayerRequest } from '../types/requests/game-update-player.http.request.js';

export class MatchService {
    async getMatchList(matchIdList: string[]): Promise<Match[]> {
        const matchSql =
            "SELECT /*試合リスト取得*/ "
            + "    M.match_id, "
            + "    M.match_day, "
            + "    M.home_team_id, "
            + "    HOME.team_nm as home_team_nm, "
            + "    M.visitor_team_id, "
            + "    VISI.team_nm as visitor_team_nm, "
            + "    M.venue_id, "
            + "    V.venue_nm, "
            + "    M.start_dt, "
            + "    M.end_dt, "
            + "    M.home_team_point, "
            + "    M.visitor_team_point, "
            + "    M.win_team_kbn, "
            + "    M.revision "
            + "FROM "
            + "    t_match M "
            + "    /*ホームチーム*/ "
            + "    LEFT OUTER JOIN m_team as HOME "
            + "    ON M.home_team_id = HOME.team_id "
            + "    /*ビジターチーム*/ "
            + "    LEFT OUTER JOIN m_team as VISI "
            + "    ON M.visitor_team_id = VISI.team_id "
            + "    /*会場*/ "
            + "    LEFT OUTER JOIN m_venue V "
            + "    ON M.venue_id = V.venue_id "
            + "WHERE "
            + "    1 = 1 "
            + "    AND :INCLAUSE ";

        const gameSql =
            "SELECT /*対戦リスト取得*/ "
            + "    G.match_id, "
            + "    G.game_no, "
            + "    G.game_status, "
            + "    G.match_day, "
            + "    G.start_dt, "
            + "    G.end_dt, "
            + "    G.home_player_id, "
            + "    G.home_jpa_player_no, "
            + "    G.home_player_nm, "
            + "    G.visitor_player_id, "
            + "    G.visitor_jpa_player_no, "
            + "    G.visitor_player_nm, "
            + "    G.home_skill_level, "
            + "    G.visitor_skill_level, "
            + "    G.home_goal, "
            + "    G.visitor_goal, "
            + "    G.home_player_point, "
            + "    G.visitor_player_point, "
            + "    G.win_player_kbn, "
            + "    G.inning, "
            + "    G.revision "
            + "FROM "
            + "    t_game G "
            + "WHERE "
            + "    1 = 1 "
            + "    AND :INCLAUSE ";

        const dao = new MysqlDao();

        try {
            // 接続
            await dao.connect();
            // ----------------------------------
            // 試合取得
            // ----------------------------------
            dao.setSql(matchSql);
            dao.addInClauseParam('M.match_id', 'INCLAUSE', 'MATCHID', matchIdList);
            const matches = await dao.executeQuery<Match>();
            // ----------------------------------
            // 対戦取得
            // ----------------------------------
            dao.setSql(gameSql);
            dao.addInClauseParam('G.match_id', 'INCLAUSE', 'MATCHID', matchIdList);
            const games = await dao.executeQuery<Game>();

            // 対戦情報を試合情報に紐づける
            matches.forEach(match => {
                match.gameList = games.filter(game => game.matchId === match.matchId);
            });

            return matches;

        } catch (error) {
            throw error;
        } finally {
            // 解放
            await dao.release();
        }
    }

    /**
   * 対戦を取得する
   * @param matchId 
   * @param gameNo 
   * @returns 
   */
    async getGame(matchId: string, gameNo: number): Promise<Game | null> {
        const sql =
            "SELECT /*対戦取得*/ "
            + "    G.match_id, "
            + "    G.game_no, "
            + "    G.game_status, "
            + "    G.match_day, "
            + "    G.start_dt, "
            + "    G.end_dt, "
            + "    G.home_player_id, "
            + "    G.home_jpa_player_no, "
            + "    G.home_player_nm, "
            + "    G.visitor_player_id, "
            + "    G.visitor_jpa_player_no, "
            + "    G.visitor_player_nm, "
            + "    G.home_skill_level, "
            + "    G.visitor_skill_level, "
            + "    G.home_goal, "
            + "    G.visitor_goal, "
            + "    G.home_player_point, "
            + "    G.visitor_player_point, "
            + "    G.win_player_kbn, "
            + "    G.inning, "
            + "    G.revision "
            + "FROM "
            + "    t_game G "
            + "WHERE "
            + "    1 = 1 "
            + "    AND G.match_id = :MATCHID "
            + "    AND G.game_no = :GAMENO "

        const dao = new MysqlDao();

        try {
            // 接続
            await dao.connect();
            // ----------------------------------
            // 対戦取得
            // ----------------------------------
            dao.setSql(sql);
            dao.addParam('MATCHID', matchId);
            dao.addParam('GAMENO', gameNo);
            const games = await dao.executeQuery<Game>();
            return games.length > 0 ? games[0]! : null;
        } catch (error) {
            throw error;
        } finally {
            // 解放
            await dao.release();
        }
    }


    /**
     * 試合・対戦を作成する
     * @param match 
     * @returns 
     */
    async create(match: Partial<Match>): Promise<Match> {
        const matchSql =
            "INSERT /*試合作成*/ INTO "
            + "    t_match ( "
            + "        match_id, "
            + "        match_day, "
            + "        home_team_id, "
            + "        visitor_team_id, "
            + "        venue_id, "
            + "        start_dt, "
            + "        end_dt, "
            + "        home_team_point, "
            + "        visitor_team_point, "
            + "        win_team_kbn, "
            + "        insert_dt, "
            + "        insert_user_id, "
            + "        insert_kino_id, "
            + "        update_dt, "
            + "        update_user_id, "
            + "        update_kino_id, "
            + "        revision "
            + "    ) "
            + "    VALUES ( "
            + "        :MATCHID, "
            + "        :MATCHDAY, "
            + "        :HOMETEAMID, "
            + "        :VISITORTEAMID, "
            + "        'V01395', " // todo : 会場IDはスタブ固定値にしている
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NOW(), "
            + "        :INSERTUSERID, "
            + "        :INSERTKINOID, "
            + "        NOW(), "
            + "        :UPDATEUSERID, "
            + "        :UPDATEKINOID, "
            + "        1 "
            + "    ) ";

        const gameSql =
            "INSERT /*対戦作成*/ INTO "
            + "    t_game ( "
            + "        match_id, "
            + "        game_no, "
            + "        game_status, "
            + "        match_day, "
            + "        start_dt, "
            + "        end_dt, "
            + "        home_player_id, "
            + "        home_jpa_player_no, "
            + "        home_player_nm, "
            + "        home_skill_level, "
            + "        home_goal, "
            + "        visitor_player_id, "
            + "        visitor_jpa_player_no, "
            + "        visitor_player_nm, "
            + "        visitor_skill_level, "
            + "        visitor_goal, "
            + "        home_player_point, "
            + "        visitor_player_point, "
            + "        home_game_point, "
            + "        visitor_game_point, "
            + "        win_player_kbn, "
            + "        first_player_kbn, "
            + "        inning, "
            + "        insert_dt, "
            + "        insert_user_id, "
            + "        insert_kino_id, "
            + "        update_dt, "
            + "        update_user_id, "
            + "        update_kino_id, "
            + "        revision "
            + "    ) "
            + "    VALUES ( "
            + "        :MATCHID, "
            + "        :GAMENO, "
            + "        :GAMESTATUS, "
            + "        :MATCHDAY, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NULL, "
            + "        NOW(), "
            + "        :INSERTUSERID, "
            + "        :INSERTKINOID, "
            + "        NOW(), "
            + "        :UPDATEUSERID, "
            + "        :UPDATEKINOID, "
            + "        1 "
            + "    ) ";

        const dao = new MysqlDao();
        try {
            // 接続
            await dao.connect();
            // ----------------------------------
            // 試合作成
            // ----------------------------------
            dao.setSql(matchSql);
            const matchId = await sequenceService.get(SequenceKbn.MATCH, match.matchDay!);
            dao.addParam('MATCHID', matchId);
            dao.addParam('MATCHDAY', DateUtil.toYYYYMMDD(match.matchDay!));
            dao.addParam('HOMETEAMID', match.homeTeamId);
            dao.addParam('VISITORTEAMID', match.visitorTeamId);
            dao.addInsertParam('test', 'test'); // todo : スタブ
            await dao.executeNonQuery();

            // ----------------------------------
            // 対戦作成
            // ----------------------------------
            for (let i = 0; i < 5; i++) {
                dao.setSql(gameSql);
                dao.addParam('MATCHID', matchId);
                dao.addParam('GAMENO', i + 1);
                dao.addParam('GAMESTATUS', GameStatus.CREATED);
                dao.addParam('MATCHDAY', DateUtil.toYYYYMMDD(match.matchDay!));
                dao.addInsertParam('test', 'test'); // todo : スタブ
                await dao.executeNonQuery();
            }

            dao.commit();

            // 作成した試合データを返す（コミット後でないと取得できない）
            const createdMatch = await this.getMatchList([matchId]);

            return createdMatch.at(0)!;

        } catch (error) {
            dao.rollback();
            throw error;
        } finally {
            // 解放
            await dao.release();
        }
    }

    /**
     * 対戦のプレイヤーを登録する
     * @param match 
     * @returns 
     */
    async updatePlayerOnGame(req: GameUpdatePlayerRequest): Promise<boolean> {
        // todo : ここから


        return true;
    }


    async getMatchFromRedis(matchId: string): Promise<Match | null> {
        return await redisClient.get<Match>(`match:${matchId}`);
    }

    async updateMatchToRedis(match: Match) {
        await redisClient.set(`match:${match.matchId}`, JSON.stringify(match));
    }

}

// シングルトンとしてエクスポート
export const matchService = new MatchService();
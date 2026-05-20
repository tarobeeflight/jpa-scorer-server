import { MysqlDao } from '../repositories/database/mysql.dao.js';
import type { Match } from '../types/match.type.js';
import type { Game } from '../types/game.type.js';
import { DateUtil } from '../utils/date.util.js';
import { sequenceService } from './sequence.service.js';
import { ActionType, GameStatus, SequenceKbn } from '../constants.js';
import type { GameUpdatePlayerRequest } from '../types/requests/game-update-player.http.request.js';
import type { UpdateFirstPlayerRequest } from '../types/requests/update-first-player.http.request.js';
import type { GameFinishRequest } from '../types/requests/game-finish.http.request.js';
import type { Action } from '../types/action.type.js';

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
            + "    G.home_game_point, "
            + "    G.visitor_game_point, "
            + "    G.win_player_kbn, "
            + "    G.first_player_kbn, "
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
            + "    G.home_skill_level, "
            + "    G.home_goal, "
            + "    G.visitor_player_id, "
            + "    G.visitor_jpa_player_no, "
            + "    G.visitor_player_nm, "
            + "    G.visitor_skill_level, "
            + "    G.visitor_goal, "
            + "    G.home_player_point, "
            + "    G.visitor_player_point, "
            + "    G.home_game_point, "
            + "    G.visitor_game_point, "
            + "    G.win_player_kbn, "
            + "    G.first_player_kbn, "
            + "    G.inning, "
            + "    G.revision "
            + "FROM "
            + "    t_game G "
            + "WHERE "
            + "    1 = 1 "
            + "    AND G.match_id = :MATCHID "
            + "    AND G.game_no = :GAMENO ";

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
     * 排他エラーの場合、falseを返す
     * @param match 
     * @returns 
     */
    async updatePlayerOnGame(req: GameUpdatePlayerRequest): Promise<{ isHaita: boolean, game: Partial<Game> | null }> {
        const sql =
            "UPDATE /*対戦プレイヤー更新*/ "
            + "    t_game G "
            + "SET "
            + "    G.game_status = :CONSTANTS_GAMESTATUS_PLAYERREGISTERED "
            + "    , G.start_dt = now() "
            + "    , G.home_player_id = :HOME_PLAYER_ID "
            + "    , G.home_jpa_player_no = :HOME_JPA_PLAYER_NO "
            + "    , G.home_player_nm = :HOME_PLAYER_NM "
            + "    , G.home_skill_level = :HOME_SKILL_LEVEL "
            + "    , G.home_goal = :HOME_GOAL "
            + "    , G.visitor_player_id = :VISITOR_PLAYER_ID "
            + "    , G.visitor_jpa_player_no = :VISITOR_JPA_PLAYER_NO "
            + "    , G.visitor_player_nm = :VISITOR_PLAYER_NM "
            + "    , G.visitor_skill_level = :VISITOR_SKILL_LEVEL "
            + "    , G.visitor_goal = :VISITOR_GOAL "
            + "    , G.home_player_point = :CONSTANTS_ZERO "
            + "    , G.visitor_player_point = :CONSTANTS_ZERO "
            + "    , G.home_game_point = :CONSTANTS_ZERO "
            + "    , G.visitor_game_point = :CONSTANTS_ZERO "
            + "    , G.inning = :CONSTANTS_ZERO "
            + "    , G.update_dt = now() "
            + "    , G.update_user_id = :UPDATEUSERID "
            + "    , G.update_kino_id = :UPDATEKINOID "
            + "    , G.revision = G.revision + 1 "
            + "WHERE "
            + "    G.match_id = :MATCH_ID  "
            + "    AND G.game_no = :GAME_NO "
            + "    AND G.revision = :REVISION ";

        const dao = new MysqlDao();

        try {
            // 接続
            await dao.connect();
            // ----------------------------------
            // 対戦更新
            // ----------------------------------
            dao.setSql(sql);
            dao.addParam('MATCH_ID', req.matchId);
            dao.addParam('GAME_NO', req.gameNo);
            // クライアントでnew Date()すると基準時刻からの経過時間を生成している
            // 出力時にローカルタイムに合わせた時刻を表示するが、httpだとUTC出力で送られるためずれる
            // めんどくさいから一旦SQLでnow()にしているが、いつかクライアントで正しい日時を送るようにする
            // プロジェクト全体でdate-fnsやdayjsなどの日時ライブラリを導入して、日時の扱いを統一したほうがいいかも
            // dao.addParam('START_DT', new Date(req.startDt)); // todo : 文字列で渡ってくる日付をDate型に変換。一括で変換するようにする。
            dao.addParam('HOME_PLAYER_ID', req.homePlayer.playerId);
            dao.addParam('HOME_JPA_PLAYER_NO', req.homePlayer.jpaPlayerId);
            dao.addParam('HOME_PLAYER_NM', req.homePlayer.name);
            dao.addParam('HOME_SKILL_LEVEL', req.homePlayer.skillLevel);
            dao.addParam('HOME_GOAL', req.homePlayer.goal);
            dao.addParam('VISITOR_PLAYER_ID', req.visitorPlayer.playerId);
            dao.addParam('VISITOR_JPA_PLAYER_NO', req.visitorPlayer.jpaPlayerId);
            dao.addParam('VISITOR_PLAYER_NM', req.visitorPlayer.name);
            dao.addParam('VISITOR_SKILL_LEVEL', req.visitorPlayer.skillLevel);
            dao.addParam('VISITOR_GOAL', req.visitorPlayer.goal);
            dao.addParam('REVISION', req.revision);
            dao.addParam('CONSTANTS_GAMESTATUS_PLAYERREGISTERED', GameStatus.PLAYER_REGISTERED);
            dao.addParam('CONSTANTS_ZERO', 0);
            dao.addUpdateParam('test', 'test'); // todo : スタブ
            const count = await dao.executeNonQuery();

            await dao.commit();

            if (count === 0) {
                // 排他エラー
                return { isHaita: true, game: null };
            }

            const game: Partial<Game> = {
                matchId: req.matchId,
                gameNo: req.gameNo,
                gameStatus: GameStatus.PLAYER_REGISTERED,
                homePlayerId: req.homePlayer.playerId,
                homeJpaPlayerNo: req.homePlayer.jpaPlayerId,
                homePlayerNm: req.homePlayer.name,
                homeSkillLevel: req.homePlayer.skillLevel,
                homeGoal: req.homePlayer.goal,
                visitorPlayerId: req.visitorPlayer.playerId,
                visitorJpaPlayerNo: req.visitorPlayer.jpaPlayerId,
                visitorPlayerNm: req.visitorPlayer.name,
                visitorSkillLevel: req.visitorPlayer.skillLevel,
                visitorGoal: req.visitorPlayer.goal,
                homePlayerPoint: 0,
                visitorPlayerPoint: 0,
                homeGamePoint: 0,
                visitorGamePoint: 0,
                inning: 0,
            }

            return { isHaita: false, game };

        } catch (error) {
            await dao.rollback();
            throw error;
        } finally {
            await dao.release();
        }
    }

    /**
     * 対戦の先攻プレイヤーを登録する
     * 排他エラーの場合、trueを返す
     * @param match 
     * @returns 
     */
    async updateFirstPlayerOnGame(req: UpdateFirstPlayerRequest): Promise<{ isHaita: boolean }> {
        const sql =
            "UPDATE /*対戦先攻プレイヤー更新*/ "
            + "    t_game G "
            + "SET "
            + "    G.first_player_kbn = :FIRST_PLAYER_KBN "
            + "    , G.update_dt = now() "
            + "    , G.update_user_id = :UPDATEUSERID "
            + "    , G.update_kino_id = :UPDATEKINOID "
            + "    , G.revision = G.revision + 1 "
            + "WHERE "
            + "    G.match_id = :MATCH_ID  "
            + "    AND G.game_no = :GAME_NO "
            + "    AND G.revision = :REVISION ";

        const dao = new MysqlDao();

        try {
            // 接続
            await dao.connect();
            // ----------------------------------
            // 対戦更新
            // ----------------------------------
            dao.setSql(sql);
            dao.addParam('MATCH_ID', req.matchId);
            dao.addParam('GAME_NO', req.gameNo);
            dao.addParam('FIRST_PLAYER_KBN', req.firstPlayerKbn);
            dao.addParam('REVISION', req.revision);
            dao.addUpdateParam('test', 'test'); // todo : スタブ
            const count = await dao.executeNonQuery();

            await dao.commit();

            if (count === 0) {
                // 排他エラーの場合、trueを返す
                const game = await this.getGame(req.matchId, req.gameNo);
                return { isHaita: true };
            }

            // 正常の場合、falseを返す
            return { isHaita: false };

        } catch (error) {
            await dao.rollback();
            throw error;
        } finally {
            await dao.release();
        }
    }

    /**
     * 対戦完了時に、対戦を更新・対戦アクションを登録する
     * 排他エラーの場合、falseを返す
     * @param req 対戦・対戦アクションリスト 
     * @returns 
     */
    async updateFinishGame(req: GameFinishRequest): Promise<{ isHaita: boolean, game: Game | null }> {
        const game: Game = req.game;
        const history: Action[] = req.history;

        const gameSql =
            "UPDATE /*対戦完了更新*/ "
            + "    t_game G "
            + "SET "
            + "    G.game_status = :CONSTANTS_GAMESTATUS_FINISHED "
            + "    , G.end_dt = :END_DT "
            + "    , G.home_player_point = :HOME_PLAYER_POINT "
            + "    , G.visitor_player_point = :VISITOR_PLAYER_POINT "
            + "    , G.home_game_point = :HOME_GAME_POINT "
            + "    , G.visitor_game_point = :VISITOR_GAME_POINT "
            + "    , G.win_player_kbn = :WIN_PLAYER_KBN "
            + "    , G.inning = :INNING "
            + "    , G.update_dt = now() "
            + "    , G.update_user_id = :UPDATEUSERID "
            + "    , G.update_kino_id = :UPDATEKINOID "
            + "    , G.revision = G.revision + 1 "
            + "WHERE "
            + "    G.match_id = :MATCH_ID  "
            + "    AND G.game_no = :GAME_NO "
            + "    AND G.revision = :REVISION ";

        const actionSql =
            "INSERT /*対戦アクション登録*/INTO  "
            + "    t_game_action(  "
            + "        match_id "
            + "        , game_no "
            + "        , action_no "
            + "        , action_player_kbn "
            + "        , rack "
            + "        , inning "
            + "        , action_type "
            + "        , ball_num "
            + "        , insert_dt "
            + "        , insert_user_id "
            + "        , insert_kino_id "
            + "        , update_dt "
            + "        , update_user_id "
            + "        , update_kino_id "
            + "        , revision "
            + "    )  "
            + "    VALUES (  "
            + "        :MATCH_ID "
            + "        , :GAME_NO "
            + "        , :ACTION_NO "
            + "        , :ACTION_PLAYER_KBN "
            + "        , :RACK "
            + "        , :INNING "
            + "        , :ACTION_TYPE "
            + "        , :BALL_NUM "
            + "        , now() "
            + "        , :INSERTUSERID "
            + "        , :INSERTKINOID "
            + "        , now() "
            + "        , :UPDATEUSERID "
            + "        , :UPDATEKINOID "
            + "        , 1 "
            + "    ) ";

        const dao = new MysqlDao();

        try {
            // 接続
            await dao.connect();
            // ----------------------------------
            // 対戦更新
            // ----------------------------------
            dao.setSql(gameSql);
            dao.addParam('MATCH_ID', game.matchId);
            dao.addParam('GAME_NO', game.gameNo);
            dao.addParam('END_DT', new Date(game.endDt));
            dao.addParam('HOME_PLAYER_POINT', game.homePlayerPoint);
            dao.addParam('HOME_GAME_POINT', game.homeGamePoint);
            dao.addParam('VISITOR_PLAYER_POINT', game.visitorPlayerPoint);
            dao.addParam('VISITOR_GAME_POINT', game.visitorGamePoint);
            dao.addParam('WIN_PLAYER_KBN', game.winPlayerKbn);
            dao.addParam('INNING', game.inning);
            dao.addParam('REVISION', game.revision);
            dao.addParam('CONSTANTS_GAMESTATUS_FINISHED', GameStatus.FINISHED);
            dao.addUpdateParam('test', 'test'); // todo : スタブ
            const count = await dao.executeNonQuery();

            if (count === 0) {
                // 排他エラー
                await dao.rollback();
                return { isHaita: true, game: null };
            }

            // ----------------------------------
            // 対戦アクション登録（バッチ実行）
            // ----------------------------------
            dao.setBatchSql(actionSql);
            history.forEach(action => {
                dao.addParam('MATCH_ID', game.matchId);
                dao.addParam('GAME_NO', game.gameNo);
                dao.addParam('ACTION_NO', action.actionNo);
                dao.addParam('ACTION_PLAYER_KBN', action.playerKbn);
                dao.addParam('RACK', action.rack);
                dao.addParam('INNING', action.inning);
                dao.addParam('ACTION_TYPE', action.type);
                dao.addParam('BALL_NUM', action.ballNumber);
                dao.addInsertParam('test', 'test'); // todo : スタブ

                dao.addBatch();
            })
            const batchCount = await dao.executeBatch();

            await dao.commit();

            const g: Game | null = await this.getGame(game.matchId, game.gameNo);

            return { isHaita: false, game: g };

        } catch (error: any) {
            await dao.rollback();
            // インサートの重複エラーの判定
            if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
                return {isHaita: true, game: null };
            } else {
                // それ以外の予期せぬエラー（接続切れ、構文エラーなど）はそのまま再スロー
                throw error;
            }
        } finally {
            await dao.release();
        }
    }

}

// シングルトンとしてエクスポート
export const matchService = new MatchService();
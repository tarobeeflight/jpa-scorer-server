import { HomeKbn } from "../constants.js";
import { codeService } from "../services/code.service.js";
import type { Action } from "../types/action.type.js";
import type { GamePoint } from "../types/game-point.type.js";
import type { Game } from "../types/game.type.js";
import type { Match } from "../types/match.type.js";

export class AppUtil {
    private isInitialized = false;
    gamePointMatrix: GamePoint[] = [];

    // コンストラクタ
    async init() {
        if (this.isInitialized) {
            return;
        }
        // 勝ち点表をコードマスタから取得
        const codeList = await codeService.get('GAME_POINT');
        this.gamePointMatrix = codeList.map(c => ({
            loserSkillLevel: Number(c.code1),
            winnerGamePoint: Number(c.code2),
            loserGamePoint: Number(c.code3),
            loserPointLower: Number(c.content1),
            loserPointUpper: Number(c.content2),
        }));
        this.isInitialized = true;
    }

    updateGameInMatch(match: Match, gameNo: number, history: Action[]): Match {
        const game = match.gameList.find(g => g.gameNo === gameNo);

        if (!game) {
            console.error('対戦情報がありません');
            return match;
        }
        
        const updatedGame: Game = {
            ...game, 
            homePlayerPoint: this.getPlayerPoint(HomeKbn.HOME, history),
            visitorPlayerPoint: this.getPlayerPoint(HomeKbn.VISITOR, history),
            homeGamePoint: this.getGamePoint(HomeKbn.HOME, game!.homeSkillLevel, history),
            visitorGamePoint: this.getGamePoint(HomeKbn.HOME, game!.visitorSkillLevel, history),
            inning: this.getCurrentInning(history),
        }

        match.gameList = match.gameList.map(g => g.gameNo === gameNo ? updatedGame : g);

        return match;
    }

    convertHistoryToGame(game: Game, history: Action[] | null): Game {
        if (!history) {
            return game;
        }

        return {
            ...game,
            homePlayerPoint: this.getPlayerPoint(HomeKbn.HOME, history),
            visitorPlayerPoint: this.getPlayerPoint(HomeKbn.VISITOR, history),
            homeGamePoint: this.getGamePoint(HomeKbn.HOME, game!.homeSkillLevel, history),
            visitorGamePoint: this.getGamePoint(HomeKbn.VISITOR, game!.visitorSkillLevel, history),
            inning: this.getCurrentInning(history),
        }
    }

    private getPlayerPoint(homeKbn: HomeKbn, history: Action[]): number {
        return history
            .filter(a => a.playerKbn === homeKbn && a.type === 'POCKET')
            .reduce((sum, a) => sum + (a.ballNumber === 9 ? 2 : 1), 0);
    }

    private getGamePoint(homeKbn: HomeKbn, skillLevel: number, history: Action[]): number {
        const playerPoint = this.getPlayerPoint(homeKbn, history);
        return this.calcLoserGamePoint(skillLevel, playerPoint);
    }

    private getCurrentInning(history: Action[]): number {
        return Math.floor(history.filter(a => a.type === 'SWITCH').length / 2) + 1;
    }

    calcLoserGamePoint(skillLevel: number, point: number): number {
        const gamePoint = this.gamePointMatrix.find(record => (
            record.loserSkillLevel === skillLevel
            && record.loserPointLower <= point
            && record.loserPointUpper >= point
        ))?.loserGamePoint;
        // todo : 勝者側の場合、マップになくてエラーになるので、一旦0で返している。要修正
        return gamePoint ?? 0;
    }
}

export const appUtil = new AppUtil();
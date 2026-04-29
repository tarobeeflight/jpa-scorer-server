import type { Game } from "./game.type.js";


export type Match = {
    matchId: string;
    matchDay: Date;
    homeTeamId: string;
    homeTeamNm: string;
    visitorTeamId: string;
    visitorTeamNm: string;
    venueId: string;
    venueNm: string;
    startDt: Date;
    endDt: Date | null;
    homeTeamPoint: number | null;
    visitorTeamPoint: number | null;
    winTeamKbn: string | null;
    gameList: Game[];
}

export type Game = {
    matchId: string;
    gameNo: number;
    gameStatus: string;
    makeMatchDay: Date | null;
    startDt: Date;
    endDt: Date;
    homePlayerId: string | null;
    homeJpaPlayerNo: string | null;
    homePlayerNm: string;
    homeSkillLevel: number;
    homeGoal: number;
    visitorPlayerId: string | null;
    visitorJpaPlayerNo: string | null;
    visitorPlayerNm: string;
    visitorSkillLevel: number;
    visitorGoal: number;
    homePlayerPoint: number;
    visitorPlayerPoint: number;
    homeGamePoint: number | null;
    visitorGamePoint: number | null;
    winPlayerKbn: string;
    firstPlayerKbn: string;
    inning: number;
}

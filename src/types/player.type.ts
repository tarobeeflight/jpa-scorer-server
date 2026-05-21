import type { HomeKbn } from "../constants.js";

export type Player = {
    homeKbn: HomeKbn;
    isFirst?: boolean;
    playerId: string | null;
    jpaPlayerId: string | null;
    name: string;
    skillLevel: number;
    goal: number;
}

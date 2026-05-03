import type { HomeKbn } from "../constants.js";

export type Player = {
    homeKbn: HomeKbn;
    isFirst?: boolean;
    playerId: string | null;
    jpaPlayerId: string | null;
    name: string;
    skillLevel: number;
    goal: number;

    // todo : 暫定対応
    id: 1 | 2; // プレイヤーID（1 or 2）
}

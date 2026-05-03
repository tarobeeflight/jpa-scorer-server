import type { Player } from "../player.type.js"

export type GameUpdatePlayerRequest = {
    matchId: string, 
    gameNo: number,
    startDt: Date,
    homePlayer: Player,
    visitorPlayer: Player,
    revision: number
}
import type { Action } from "../action.type.js";

export type UpdateScoreSocketRequest = { matchId: string, gameNo: number, history: Action[] }
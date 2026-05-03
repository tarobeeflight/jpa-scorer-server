import { HomeKbn } from "../../constants.js";

export type UpdateFirstPlayerRequest = { matchId: string, gameNo: number, firstPlayerKbn: HomeKbn, revision: number };
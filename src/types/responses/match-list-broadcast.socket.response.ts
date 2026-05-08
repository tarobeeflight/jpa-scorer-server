import type { Game } from "../game.type.js";
import type { Match } from "../match.type.js";

export type MatchListBroadcastSocketResponse = { game: Partial<Game> | null, match: Match | null };
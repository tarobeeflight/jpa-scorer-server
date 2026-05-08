import type { Action } from "../action.type.js";
import type { Game } from "../game.type.js";

export type UpdateScoreSocketRequest = { game: Game, history: Action[] }
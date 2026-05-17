import type { Action } from "../action.type.js";
import type { GamePoint } from "../game-point.type.js";
import type { Game } from "../game.type.js";

export type JpaMatchInitResponse = { game: Game | null, history: Action[], gamePointMatrix: GamePoint[] };
import type { Game } from "../game.type.js";
import type { Match } from "../match.type.js";

export type PlayerInfoInitResponse = { match: Match | null, game: Game | null, skillToGoal: { [key: number]: number } };
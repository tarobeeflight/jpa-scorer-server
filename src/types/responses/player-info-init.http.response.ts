import type { Game } from "../game.type.js";

export type PlayerInfoInitResponse = { game: Game | null, skillToGoal: { [key: number]: number } };
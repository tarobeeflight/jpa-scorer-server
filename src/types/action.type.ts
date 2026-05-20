import type { ActionType, HomeKbn } from "../constants.js";

export type Action = {
  actionNo: number;
  playerKbn: HomeKbn;
  rack: number;
  inning: number;
  type: ActionType;
  ballNumber?: number;
  rackEnd?: boolean;
}
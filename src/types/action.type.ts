export type ActionType = 'POCKET' | 'DEAD' | 'NO_ACTION_DEAD' | 'SAFETY' | 'SWITCH';

export type Action = {
  id: number;
  playerId: number;
  rack: number;
  inning: number;
  type: ActionType;
  ballNumber?: number;
  rackEnd?: boolean;
}
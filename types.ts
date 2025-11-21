export interface Team {
  id: string;
  name: string;
  pot: number;
  confederation: string;
  flag?: string; // Optional emoji or code
}

export interface Group {
  name: string;
  teams: Team[];
}

export interface DrawState {
  groups: Group[];
  currentPotIndex: number;
  currentGroupIndex: number; // 0-11
  availableTeamsInPot: Team[];
  drawnTeams: Team[];
  isFinished: boolean;
}

export type PotData = Team[];
export interface Incident {
  id: number;
  lastIncidentDate: string;
}

export interface IncidentStreak {
  streakStartDate: string;
  streakEndDate: string;
}

export enum IncidentView {
  CURRENT_STREAK,
  PAST_STREAKS
}

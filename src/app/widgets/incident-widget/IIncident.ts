export interface IIncident {
  id: number;
  lastIncidentDate: string;
}

export interface IIncidentStreak {
  streakStartDate: string;
  streakEndDate: string;
}

export enum IIncidentViewEnum {
  CURRENT_STREAK,
  PAST_STREAKS
}

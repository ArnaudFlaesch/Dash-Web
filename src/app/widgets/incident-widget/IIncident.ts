export interface IIncident {
  id: number;
  incidentName: string;
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

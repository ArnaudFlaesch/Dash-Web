export type IIncident = {
  id: number;
  lastIncidentDate: string;
};

export type IIncidentStreak = {
  streakStartDate: string;
  streakEndDate: string;
};

export enum IIncidentViewEnum {
  CURRENT_STREAK,
  PAST_STREAKS
}

export interface WorkoutType {
  id: number;
  name: string;
  userId: number;
}

export interface WorkoutSession {
  id: number;
  workoutDate: string;
  userId: number;
}

export interface WorkoutExercise {
  workoutTypeId: number;
  numberOfReps: number;
}

export interface WorkoutStatsByPeriod {
  workoutTypeName: string;
  totalNumberOfReps: number;
}

export interface WorkoutStatByMonth {
  totalNumberOfReps: number;
  workoutTypeId: number;
  monthPeriod: string;
  workoutTypeName: string;
}

export enum WorkoutWidgetView {
  WORKOUT_SESSIONS_LIST_VIEW = 1,
  WORKOUT_STATISTICS_VIEW = 2,
  EDIT_WORKOUT_SESSION_VIEW = 3
}

export enum WorkoutStatisticsPeriod {
  LAST_YEAR = 1,
  CURRENT_YEAR = 2,
  LAST_SIX_MONTHS = 3,
  LAST_THREE_MONTHS = 4
}

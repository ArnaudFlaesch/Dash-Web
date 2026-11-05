export interface IWorkoutType {
  id: number;
  name: string;
  userId: number;
}

export interface IWorkoutSession {
  id: number;
  workoutDate: string;
  userId: number;
}

export interface IWorkoutExercise {
  workoutTypeId: number;
  numberOfReps: number;
}

export interface IWorkoutStatsByPeriod {
  workoutTypeName: string;
  totalNumberOfReps: number;
}

export interface IWorkoutStatByMonth {
  totalNumberOfReps: number;
  workoutTypeId: number;
  monthPeriod: string;
  workoutTypeName: string;
}

export enum WORKOUT_WIDGET_VIEW {
  WORKOUT_SESSIONS_LIST_VIEW = 1,
  WORKOUT_STATISTICS_VIEW = 2,
  EDIT_WORKOUT_SESSION_VIEW = 3
}

export enum WORKOUT_STATISTICS {
  LAST_YEAR = 1,
  CURRENT_YEAR = 2,
  LAST_SIX_MONTHS = 3,
  LAST_THREE_MONTHS = 4
}

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

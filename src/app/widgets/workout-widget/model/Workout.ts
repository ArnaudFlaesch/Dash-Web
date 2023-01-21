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

export interface IWorkoutStatsByMonth {
  workoutTypeName: string;
  totalNumberOfReps: number;
}

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
  workoutSessionId: number;
  workoutTypeId: number;
  numberOfReps: number;
}

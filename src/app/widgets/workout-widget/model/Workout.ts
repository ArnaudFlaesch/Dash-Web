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
  workoutExerciseId: IWorkoutExerciseId;
  numberOfReps: number;
}

interface IWorkoutExerciseId {
  workoutSessionId: number;
  workoutTypeId: number;
}

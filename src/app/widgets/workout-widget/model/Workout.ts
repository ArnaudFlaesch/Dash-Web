export interface IWorkoutType {
  id: number;
  name: string;
}

export interface IWorkoutSession {
  id: number;
  workoutDate: string;
}

export interface IWorkoutExercise {
  workoutExerciseId: IWorkoutExerciseId;
  numberOfReps: number;
}

interface IWorkoutExerciseId {
  workoutSessionId: number;
  workoutTypeId: number;
}

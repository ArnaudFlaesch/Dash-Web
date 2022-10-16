export interface IAddWorkoutTypePayload {
  workoutType: string;
  userId: number;
}

export interface ICreateWorkoutSessionPayload {
  workoutDate: Date;
  userId: number;
}

export interface IUpdateWorkoutExercisePayload {
  workoutSessionId: number;
  workoutTypeId: number;
  numberOfReps: number;
}

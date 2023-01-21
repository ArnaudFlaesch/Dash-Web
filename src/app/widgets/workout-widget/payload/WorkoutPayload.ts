export interface IAddWorkoutTypePayload {
  workoutType: string;
}

export interface ICreateWorkoutSessionPayload {
  workoutDate: Date;
}

export interface IUpdateWorkoutExercisePayload {
  workoutSessionId: number;
  workoutTypeId: number;
  numberOfReps: number;
}

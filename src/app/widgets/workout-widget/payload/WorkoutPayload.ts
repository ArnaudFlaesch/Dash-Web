export type IAddWorkoutTypePayload = {
  workoutType: string;
};

export type ICreateWorkoutSessionPayload = {
  workoutDate: Date;
};

export type IUpdateWorkoutExercisePayload = {
  workoutSessionId: number;
  workoutTypeId: number;
  numberOfReps: number;
};

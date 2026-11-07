export interface AddWorkoutTypePayload {
  workoutType: string;
}

export interface CreateWorkoutSessionPayload {
  workoutDate: Date;
}

export interface UpdateWorkoutExercisePayload {
  workoutSessionId: number;
  workoutTypeId: number;
  numberOfReps: number;
}

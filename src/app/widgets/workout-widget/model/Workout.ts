export type IWorkoutType = {
  id: number;
  name: string;
  userId: number;
};

export type IWorkoutSession = {
  id: number;
  workoutDate: string;
  userId: number;
};

export type IWorkoutExercise = {
  workoutTypeId: number;
  numberOfReps: number;
};

export type IWorkoutStatsByPeriod = {
  workoutTypeName: string;
  totalNumberOfReps: number;
};

export type IWorkoutStatByMonth = {
  totalNumberOfReps: number;
  workoutTypeId: number;
  monthPeriod: string;
  workoutTypeName: string;
};

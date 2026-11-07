import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { format } from "date-fns";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";
import {
  WorkoutExercise,
  WorkoutSession,
  WorkoutStatByMonth,
  WorkoutStatsByPeriod,
  WorkoutType
} from "./workout";
import {
  AddWorkoutTypePayload,
  CreateWorkoutSessionPayload,
  UpdateWorkoutExercisePayload
} from "./workout-payload";

@Service()
export class WorkoutWidgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/workoutWidget`;
  private readonly dateFormat = "yyyy-MM-dd";

  public getWorkoutTypes(): Observable<WorkoutType[]> {
    return this.http.get<WorkoutType[]>(`${this.baseUrl}/workoutTypes`);
  }

  public getWorkoutSessions(
    dateIntervalStart: Date,
    dateIntervalEnd: Date
  ): Observable<WorkoutSession[]> {
    return this.http.get<WorkoutSession[]>(`${this.baseUrl}/workoutSessions`, {
      params: this.getIntervalParams(dateIntervalStart, dateIntervalEnd)
    });
  }

  public getWorkoutExercises(workoutSessionId: number): Observable<WorkoutExercise[]> {
    return this.http.get<WorkoutExercise[]>(`${this.baseUrl}/workoutExercises`, {
      params: { workoutSessionId }
    });
  }

  public getWorkoutStatsByPeriod(
    dateIntervalStart: Date,
    dateIntervalEnd: Date
  ): Observable<WorkoutStatsByPeriod[]> {
    return this.http.get<WorkoutStatsByPeriod[]>(`${this.baseUrl}/workoutStatsByPeriod`, {
      params: this.getIntervalParams(dateIntervalStart, dateIntervalEnd)
    });
  }

  public getWorkoutStatsByMonth(
    dateIntervalStart: Date,
    dateIntervalEnd: Date
  ): Observable<WorkoutStatByMonth[]> {
    return this.http.get<WorkoutStatByMonth[]>(`${this.baseUrl}/workoutStatsByMonth`, {
      params: this.getIntervalParams(dateIntervalStart, dateIntervalEnd)
    });
  }

  public addWorkoutType(workoutType: string): Observable<WorkoutType> {
    const payload: AddWorkoutTypePayload = { workoutType };
    return this.http.post<WorkoutType>(`${this.baseUrl}/addWorkoutType`, payload);
  }

  public createWorkoutSession(workoutDate: Date): Observable<WorkoutSession> {
    const payload: CreateWorkoutSessionPayload = { workoutDate };
    return this.http.post<WorkoutSession>(`${this.baseUrl}/createWorkoutSession`, payload);
  }

  public updateWorkoutExercise(
    workoutSessionId: number,
    workoutTypeId: number,
    numberOfReps: number
  ): Observable<WorkoutExercise> {
    const payload: UpdateWorkoutExercisePayload = {
      workoutSessionId,
      workoutTypeId,
      numberOfReps
    };
    return this.http.post<WorkoutExercise>(`${this.baseUrl}/updateWorkoutExercise`, payload);
  }

  private getIntervalParams(
    dateIntervalStart: Date,
    dateIntervalEnd: Date
  ): { dateIntervalStart: string; dateIntervalEnd: string } {
    return {
      dateIntervalStart: format(dateIntervalStart, this.dateFormat),
      dateIntervalEnd: format(dateIntervalEnd, this.dateFormat)
    };
  }
}

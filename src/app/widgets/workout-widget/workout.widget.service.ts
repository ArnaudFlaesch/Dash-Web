import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { format } from "date-fns";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  IWorkoutExercise,
  IWorkoutSession,
  IWorkoutStatByMonth,
  IWorkoutStatsByPeriod,
  IWorkoutType
} from "./model/Workout";
import {
  IAddWorkoutTypePayload,
  ICreateWorkoutSessionPayload,
  IUpdateWorkoutExercisePayload
} from "./payload/WorkoutPayload";

@Service()
export class WorkoutWidgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/workoutWidget`;
  private readonly dateFormat = "yyyy-MM-dd";

  public getWorkoutTypes(): Observable<IWorkoutType[]> {
    return this.http.get<IWorkoutType[]>(`${this.baseUrl}/workoutTypes`);
  }

  public getWorkoutSessions(
    dateIntervalStart: Date,
    dateIntervalEnd: Date
  ): Observable<IWorkoutSession[]> {
    return this.http.get<IWorkoutSession[]>(`${this.baseUrl}/workoutSessions`, {
      params: this.getIntervalParams(dateIntervalStart, dateIntervalEnd)
    });
  }

  public getWorkoutExercises(workoutSessionId: number): Observable<IWorkoutExercise[]> {
    return this.http.get<IWorkoutExercise[]>(
      `${this.baseUrl}/workoutExercises?workoutSessionId=${workoutSessionId}`
    );
  }

  public getWorkoutStatsByPeriod(
    dateIntervalStart: Date,
    dateIntervalEnd: Date
  ): Observable<IWorkoutStatsByPeriod[]> {
    return this.http.get<IWorkoutStatsByPeriod[]>(`${this.baseUrl}/workoutStatsByPeriod`, {
      params: this.getIntervalParams(dateIntervalStart, dateIntervalEnd)
    });
  }

  public getWorkoutStatsByMonth(
    dateIntervalStart: Date,
    dateIntervalEnd: Date
  ): Observable<IWorkoutStatByMonth[]> {
    return this.http.get<IWorkoutStatByMonth[]>(`${this.baseUrl}/workoutStatsByMonth`, {
      params: this.getIntervalParams(dateIntervalStart, dateIntervalEnd)
    });
  }

  public addWorkoutType(workoutType: string): Observable<IWorkoutType> {
    const payload: IAddWorkoutTypePayload = { workoutType };
    return this.http.post<IWorkoutType>(`${this.baseUrl}/addWorkoutType`, payload);
  }

  public createWorkoutSession(workoutDate: Date): Observable<IWorkoutSession> {
    const payload: ICreateWorkoutSessionPayload = { workoutDate };
    return this.http.post<IWorkoutSession>(`${this.baseUrl}/createWorkoutSession`, payload);
  }

  public updateWorkoutExercise(
    workoutSessionId: number,
    workoutTypeId: number,
    numberOfReps: number
  ): Observable<IWorkoutExercise> {
    const payload: IUpdateWorkoutExercisePayload = {
      workoutSessionId,
      workoutTypeId,
      numberOfReps
    };
    return this.http.post<IWorkoutExercise>(`${this.baseUrl}/updateWorkoutExercise`, payload);
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

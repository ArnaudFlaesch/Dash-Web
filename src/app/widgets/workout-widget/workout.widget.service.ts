import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import authorizationBearer from '../../services/authorizationBearer/authorizationBearer';
import {
  IWorkoutExercise,
  IWorkoutSession,
  IWorkoutStatsByPeriod,
  IWorkoutType
} from './model/Workout';
import {
  IAddWorkoutTypePayload,
  ICreateWorkoutSessionPayload,
  IUpdateWorkoutExercisePayload
} from './payload/WorkoutPayload';
import { format } from 'date-fns';

@Injectable()
export class WorkoutWidgetService {
  private dateFormat = 'yyyy-MM-dd';

  constructor(private http: HttpClient) {}

  public getWorkoutTypes(): Observable<IWorkoutType[]> {
    return this.http.get<IWorkoutType[]>(`${environment.backend_url}/workoutWidget/workoutTypes`, {
      headers: {
        Authorization: authorizationBearer(),
        'Content-type': 'application/json'
      }
    });
  }

  public getWorkoutSessions(
    dateIntervalStart: Date,
    dateIntervalEnd: Date
  ): Observable<IWorkoutSession[]> {
    return this.http.get<IWorkoutSession[]>(
      `${environment.backend_url}/workoutWidget/workoutSessions`,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        },
        params: {
          dateIntervalStart: format(dateIntervalStart, this.dateFormat),
          dateIntervalEnd: format(dateIntervalEnd, this.dateFormat)
        }
      }
    );
  }

  public getWorkoutExercises(workoutSessionId: number): Observable<IWorkoutExercise[]> {
    return this.http.get<IWorkoutExercise[]>(
      `${environment.backend_url}/workoutWidget/workoutExercises?workoutSessionId=${workoutSessionId}`,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }

  public getWorkoutStatsByPeriod(
    dateIntervalStart: Date,
    dateIntervalEnd: Date
  ): Observable<IWorkoutStatsByPeriod[]> {
    return this.http.get<IWorkoutStatsByPeriod[]>(
      `${environment.backend_url}/workoutWidget/workoutStatsByPeriod`,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        },
        params: {
          dateIntervalStart: format(dateIntervalStart, this.dateFormat),
          dateIntervalEnd: format(dateIntervalEnd, this.dateFormat)
        }
      }
    );
  }

  public addWorkoutType(newWorkoutType: string): Observable<IWorkoutType> {
    const addWorkoutTypePayload: IAddWorkoutTypePayload = {
      workoutType: newWorkoutType
    };
    return this.http.post<IWorkoutType>(
      `${environment.backend_url}/workoutWidget/addWorkoutType`,
      addWorkoutTypePayload,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }

  public createWorkoutSession(workoutSessionDate: Date): Observable<IWorkoutSession> {
    const createWorkoutSessionPayload: ICreateWorkoutSessionPayload = {
      workoutDate: workoutSessionDate
    };
    return this.http.post<IWorkoutSession>(
      `${environment.backend_url}/workoutWidget/createWorkoutSession`,
      createWorkoutSessionPayload,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }

  public updateWorkoutExercise(
    workoutSessionId: number,
    workoutTypeId: number,
    numberOfReps: number
  ): Observable<IWorkoutExercise> {
    const updateWorkoutExercisePayload: IUpdateWorkoutExercisePayload = {
      workoutSessionId: workoutSessionId,
      workoutTypeId: workoutTypeId,
      numberOfReps: numberOfReps
    };

    return this.http.post<IWorkoutExercise>(
      `${environment.backend_url}/workoutWidget/updateWorkoutExercise`,
      updateWorkoutExercisePayload,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }
}

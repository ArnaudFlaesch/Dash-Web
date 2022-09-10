import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import authorizationBearer from '../../services/authorizationBearer/authorizationBearer';
import { environment } from '../../../environments/environment';
import { IWorkoutType, IWorkoutExercise, IWorkoutSession } from './model/Workout';
import {
  IAddWorkoutTypePayload,
  ICreateWorkoutSessionPayload,
  IUpdateWorkoutExercisePayload
} from './payload/WorkoutPayload';

@Injectable()
export class WorkoutWidgetService {
  constructor(private http: HttpClient) {}

  public getWorkoutTypes(): Observable<IWorkoutType[]> {
    return this.http.get<IWorkoutType[]>(`${environment.backend_url}/workoutWidget/workoutTypes`, {
      headers: {
        Authorization: authorizationBearer(),
        'Content-type': 'application/json'
      }
    });
  }

  public getWorkoutSessions(): Observable<IWorkoutSession[]> {
    return this.http.get<IWorkoutSession[]>(
      `${environment.backend_url}/workoutWidget/workoutSessions`,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
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

  public addWorkoutType(newWorkoutType: string): Observable<IWorkoutType> {
    const addWorkoutTypePayload: IAddWorkoutTypePayload = { workoutType: newWorkoutType };
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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IUser } from './../../model/User';
import jwt_decode, { InvalidTokenError } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
interface IJwt {
  sub: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthService {
  constructor(private http: HttpClient) {}

  private headers = {
    'Content-type': 'application/json'
  };

  public login(username: string, password: string): Observable<IUser> {
    return this.http
      .post<IUser>(
        `${environment.backend_url}/auth/login`,
        {
          username,
          password
        },
        {
          headers: this.headers
        }
      )
      .pipe(
        map((response) => {
          if (response.accessToken) {
            localStorage.setItem('user', JSON.stringify(response));
          }
          return response;
        })
      );
  }

  public logout(): void {
    localStorage.removeItem('user');
  }

  public getCurrentUserData(): IUser | null {
    const userData = localStorage.getItem('user');
    if (!userData) {
      return null;
    } else {
      return JSON.parse(userData);
    }
  }

  public isTokenExpired(): boolean {
    const authenticatedUser = this.getCurrentUserData();
    if (!authenticatedUser || !authenticatedUser.accessToken) {
      return false;
    } else {
      let result = false;
      try {
        result = Date.now() >= jwt_decode<IJwt>(authenticatedUser.accessToken).exp * 1000;
      } catch (error) {
        result = false;
      }
      return result;
    }
  }
}

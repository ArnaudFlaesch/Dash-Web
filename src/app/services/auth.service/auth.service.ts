import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IUser } from './../../model/User';
import jwt_decode from 'jwt-decode';
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

  public getCurrentUser(): IUser | null {
    const userData = localStorage.getItem('user');
    if (!userData) {
      return null;
    } else {
      return JSON.parse(userData);
    }
  }

  private isTokenExpired(): boolean {
    const authenticatedUser = this.getCurrentUser();
    if (!authenticatedUser || !authenticatedUser.accessToken) {
      return false;
    } else {
      return (
        Date.now() >= jwt_decode<IJwt>(authenticatedUser.accessToken).exp * 1000
      );
    }
  }

  public isUserAuthenticated(): boolean {
    return this.getCurrentUser() !== null && !this.isTokenExpired();
  }
}

import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { jwtDecode } from "jwt-decode";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { RoleEnum } from "../../../app/model/RoleEnum";
import { environment } from "../../../environments/environment";
import { IUser } from "./../../model/User";

interface IJwt {
  sub: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly headers = {
    "Content-type": "application/json"
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
            localStorage.setItem("user", JSON.stringify(response));
          }
          return response;
        })
      );
  }

  public logout(): void {
    localStorage.removeItem("user");
  }

  public userHasValidToken(): boolean {
    const authenticatedUser = this.getCurrentUserData();
    let result = false;
    if (authenticatedUser?.accessToken) {
      try {
        result = Date.now() < jwtDecode<IJwt>(authenticatedUser.accessToken).exp * 1000;
      } catch {
        result = false;
      }
    }
    return result;
  }

  public isUserAdmin(): boolean {
    const authenticatedUser = this.getCurrentUserData();
    return authenticatedUser?.roles.includes(RoleEnum.ROLE_ADMIN) ?? false;
  }

  private getCurrentUserData(): IUser | null {
    const userData = localStorage.getItem("user");
    if (!userData) {
      return null;
    } else {
      return JSON.parse(userData);
    }
  }
}

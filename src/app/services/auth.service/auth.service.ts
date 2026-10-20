import { HttpClient } from "@angular/common/http";
import { computed, inject, Service, signal } from "@angular/core";
import { Observable, tap } from "rxjs";
import { environment } from "../../../environments/environment";
import { RoleEnum } from "../../model/RoleEnum";
import { IUser } from "../../model/User";

interface IJwt {
  sub: string;
  iat: number;
  exp: number;
}

const USER_STORAGE_KEY = "user";

/** Reads the payload of a JWT, without verifying it. Throws if the token is malformed. */
function decodeJwtPayload(token: string): IJwt {
  const payload = token.split(".")[1];
  if (!payload) {
    throw new Error("Invalid token");
  }
  // The payload is encoded in base64url
  return JSON.parse(atob(payload.replaceAll("-", "+").replaceAll("_", "/")));
}

@Service()
export class AuthService {
  public readonly isUserAdmin = computed(
    () => this.currentUser()?.roles.includes(RoleEnum.ROLE_ADMIN) ?? false
  );

  private readonly http = inject(HttpClient);
  private readonly currentUser = signal<IUser | null>(this.readStoredUser());

  public login(username: string, password: string): Observable<IUser> {
    return this.http
      .post<IUser>(`${environment.backend_url}/auth/login`, { username, password })
      .pipe(
        tap((user) => {
          if (user.accessToken) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
            this.currentUser.set(user);
          }
        })
      );
  }

  public logout(): void {
    localStorage.removeItem(USER_STORAGE_KEY);
    this.currentUser.set(null);
  }

  public userHasValidToken(): boolean {
    // Read from the storage, as the token can be removed outside of this service
    const accessToken = this.readStoredUser()?.accessToken;
    if (!accessToken) {
      return false;
    }
    try {
      return Date.now() < decodeJwtPayload(accessToken).exp * 1000;
    } catch {
      return false;
    }
  }

  private readStoredUser(): IUser | null {
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  }
}

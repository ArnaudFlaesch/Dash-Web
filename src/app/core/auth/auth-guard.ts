import { inject } from "@angular/core";
import { CanActivateFn, Router, UrlTree } from "@angular/router";
import { AuthService } from "./auth-service";

/** Only lets an authenticated user (with a valid token) through, else redirects to the login page */
export const authGuard: CanActivateFn = (): boolean | UrlTree =>
  inject(AuthService).userHasValidToken() || inject(Router).createUrlTree(["/login"]);

import { inject } from "@angular/core";
import { CanActivateFn } from "@angular/router";
import { AuthService } from "./auth.service";

/** Only lets an authenticated user (with a valid token) through */
export const authGuard: CanActivateFn = (): boolean => inject(AuthService).userHasValidToken();

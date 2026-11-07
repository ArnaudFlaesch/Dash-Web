import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { environment } from "@environments/environment";
import { AuthService } from "./auth-service";

/**
 * Adds the user's bearer token to every request sent to the Dash backend,
 * except the authentication endpoints.
 * The url is compared with the backend url followed by a slash, so that the token is never sent
 * to another host starting with the same characters (e.g. http://localhost:8080.evil.com).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getAccessToken();
  if (!token || !req.url.startsWith(`${environment.backend_url}/`) || req.url.includes("/auth/")) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

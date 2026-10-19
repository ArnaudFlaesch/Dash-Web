import { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import authorizationBearer from "../authorizationBearer/authorizationBearer";

/**
 * Adds the user's bearer token to every request sent to the Dash backend,
 * except the authentication endpoints.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = authorizationBearer();
  if (!token || !req.url.startsWith(environment.backend_url) || req.url.includes("/auth/")) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: token } }));
};

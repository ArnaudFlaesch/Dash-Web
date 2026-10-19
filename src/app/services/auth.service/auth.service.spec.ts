import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { environment } from "../../../environments/environment";
import { RoleEnum } from "../../model/RoleEnum";
import { AuthService } from "./auth.service";

/** Builds an unsigned JWT whose payload only contains the expiration date (in seconds). */
function createToken(expirationInSeconds: number): string {
  const payload = btoa(JSON.stringify({ sub: "user", iat: 0, exp: expirationInSeconds }));
  return `header.${payload}.signature`;
}

describe("AuthService", () => {
  let authService: AuthService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem("user");
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    authService = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.removeItem("user");
  });

  it("Should store the logged in user and expose its roles", () => {
    const user = {
      id: 1,
      username: "admin",
      email: "admin@email.com",
      accessToken: createToken(Date.now() / 1000 + 3600),
      roles: [RoleEnum.ROLE_ADMIN]
    };
    expect(authService.isUserAdmin()).toBe(false);

    authService.login("admin", "password").subscribe();
    httpTestingController.expectOne(`${environment.backend_url}/auth/login`).flush(user);

    expect(JSON.parse(localStorage.getItem("user") ?? "{}")).toEqual(user);
    expect(authService.isUserAdmin()).toBe(true);
    expect(authService.userHasValidToken()).toBe(true);

    authService.logout();
    expect(localStorage.getItem("user")).toBeNull();
    expect(authService.isUserAdmin()).toBe(false);
    expect(authService.userHasValidToken()).toBe(false);
  });

  it("Should not store the user when no token is returned", () => {
    authService.login("user", "password").subscribe();
    httpTestingController
      .expectOne(`${environment.backend_url}/auth/login`)
      .flush({ id: 1, username: "user", roles: [] });
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("Should reject expired and malformed tokens", () => {
    localStorage.setItem("user", JSON.stringify({ accessToken: createToken(0) }));
    expect(authService.userHasValidToken()).toBe(false);

    localStorage.setItem("user", JSON.stringify({ accessToken: "not-a-jwt" }));
    expect(authService.userHasValidToken()).toBe(false);
  });
});

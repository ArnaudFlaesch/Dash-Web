import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { vi } from "vitest";
import { AuthService } from "./auth-service";
import { authGuard } from "./auth-guard";

describe("authGuard", () => {
  function runGuard(): ReturnType<typeof authGuard> {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Should let a user with a valid token through", () => {
    vi.spyOn(TestBed.inject(AuthService), "userHasValidToken").mockReturnValue(true);
    expect(runGuard()).toBe(true);
  });

  it("Should redirect a user without a valid token to the login page", () => {
    vi.spyOn(TestBed.inject(AuthService), "userHasValidToken").mockReturnValue(false);
    const result = runGuard();
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toEqual("/login");
  });
});

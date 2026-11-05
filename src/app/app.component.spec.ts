import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { vi } from "vitest";
import { AppComponent } from "./app.component";
import { AuthService } from "./services/auth.service";
import { ThemeService } from "./services/theme.service";

describe("AppComponent", () => {
  let component: AppComponent;
  let navigateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    localStorage.removeItem("user");
    localStorage.removeItem("preferredTheme");
    navigateSpy = vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);
    const fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("preferredTheme");
    document.body.classList.remove("dark-mode");
  });

  it("should create the app", () => {
    expect(component).toBeTruthy();
  });

  it("Should redirect to the login page when the user has no valid token", () => {
    component.ngOnInit();
    expect(navigateSpy).toHaveBeenCalledWith(["/login"]);
  });

  it("Should stay on the current page when the user has a valid token", () => {
    vi.spyOn(TestBed.inject(AuthService), "userHasValidToken").mockReturnValue(true);
    component.ngOnInit();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("Should apply the preferred theme", () => {
    localStorage.setItem("preferredTheme", "dark");
    component.ngOnInit();
    expect(TestBed.inject(ThemeService).isDarkModeEnabled()).toBe(true);
    expect(document.body.classList).toContain("dark-mode");
  });

  it("Should render the router outlet", async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector("router-outlet")).not.toBeNull();
  });
});

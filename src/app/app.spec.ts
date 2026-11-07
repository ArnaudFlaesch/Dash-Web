import { TestBed } from "@angular/core/testing";
import { App } from "./app";
import { ThemeService } from "./core/theme/theme-service";

describe("App", () => {
  let component: App;

  beforeEach(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("preferredTheme");
    const fixture = TestBed.createComponent(App);
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

  it("Should apply the preferred theme", () => {
    localStorage.setItem("preferredTheme", "dark");
    component.ngOnInit();
    expect(TestBed.inject(ThemeService).isDarkModeEnabled()).toBe(true);
    expect(document.body.classList).toContain("dark-mode");
  });

  it("Should render the router outlet", async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector("router-outlet")).not.toBeNull();
  });
});

import { TestBed } from "@angular/core/testing";
import { ThemeService } from "./theme.service";

describe("ThemeService", () => {
  let themeService: ThemeService;

  beforeEach(() => {
    localStorage.removeItem("preferredTheme");
    document.body.classList.remove("dark-mode");
    TestBed.configureTestingModule({});
    themeService = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.removeItem("preferredTheme");
    document.body.classList.remove("dark-mode");
  });

  it("Should use the light theme by default", () => {
    expect(themeService.isPreferredThemeDarkMode()).toBe(false);
    expect(themeService.isDarkModeEnabled()).toBe(false);
  });

  it("Should enable then disable the dark mode", () => {
    themeService.selectDarkMode(true);
    expect(themeService.isDarkModeEnabled()).toBe(true);
    expect(document.body.classList).toContain("dark-mode");
    expect(localStorage.getItem("preferredTheme")).toEqual("dark");
    expect(themeService.isPreferredThemeDarkMode()).toBe(true);

    themeService.selectDarkMode(false);
    expect(themeService.isDarkModeEnabled()).toBe(false);
    expect(document.body.classList).not.toContain("dark-mode");
    expect(localStorage.getItem("preferredTheme")).toEqual("light");
    expect(themeService.isPreferredThemeDarkMode()).toBe(false);
  });

  it("Should not save the theme when it does not change", () => {
    themeService.selectDarkMode(false);
    expect(localStorage.getItem("preferredTheme")).toBeNull();
  });
});

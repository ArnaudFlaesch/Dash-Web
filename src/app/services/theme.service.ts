import { DOCUMENT, inject, Service, signal } from "@angular/core";

@Service()
export class ThemeService {
  private static readonly DARK_MODE_CLASS_NAME = "dark-mode";
  private static readonly PREFERRED_THEME_STORAGE_KEY = "preferredTheme";

  private readonly document = inject(DOCUMENT);
  private readonly darkModeEnabled = signal(false);

  public readonly isDarkModeEnabled = this.darkModeEnabled.asReadonly();

  public selectDarkMode(isDarkModeEnabled: boolean): void {
    if (this.darkModeEnabled() !== isDarkModeEnabled) {
      this.darkModeEnabled.set(isDarkModeEnabled);
      this.document.body.classList.toggle(ThemeService.DARK_MODE_CLASS_NAME, isDarkModeEnabled);
      localStorage.setItem(
        ThemeService.PREFERRED_THEME_STORAGE_KEY,
        isDarkModeEnabled ? "dark" : "light"
      );
    }
  }

  public isPreferredThemeDarkMode(): boolean {
    return localStorage.getItem(ThemeService.PREFERRED_THEME_STORAGE_KEY) === "dark";
  }
}

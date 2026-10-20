import { computed, DOCUMENT, inject, Service, signal } from "@angular/core";

@Service()
export class ThemeService {
  public readonly DARK_MODE_CLASS_NAME = "dark-mode";
  public readonly PREFERRED_THEME_LOCALSTORAGE_KEY = "preferredTheme";

  public readonly isDarkModeEnabled = computed(() => this.darkModeEnabled());

  private readonly document = inject(DOCUMENT);
  private readonly darkModeEnabled = signal(false);

  public selectDarkMode(isDarkModeEnabled: boolean): void {
    if (this.darkModeEnabled() !== isDarkModeEnabled) {
      this.darkModeEnabled.set(isDarkModeEnabled);
      this.document.body.classList.toggle(this.DARK_MODE_CLASS_NAME, isDarkModeEnabled);
      localStorage.setItem(
        this.PREFERRED_THEME_LOCALSTORAGE_KEY,
        isDarkModeEnabled ? "dark" : "light"
      );
    }
  }

  public isPreferredThemeDarkMode(): boolean {
    return localStorage.getItem(this.PREFERRED_THEME_LOCALSTORAGE_KEY) === "dark";
  }
}

import { Component, inject, OnInit } from "@angular/core";
import { Router, RouterOutlet } from "@angular/router";
import { AuthService } from "./core/auth/auth-service";
import { ThemeService } from "./core/theme/theme-service";

@Component({
  selector: "dash-root",
  templateUrl: "./app.html",
  imports: [RouterOutlet]
})
export class App implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  public ngOnInit(): void {
    if (!this.authService.userHasValidToken()) {
      void this.router.navigate(["/login"]);
    }
    this.themeService.selectDarkMode(this.themeService.isPreferredThemeDarkMode());
  }
}

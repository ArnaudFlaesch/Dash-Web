import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { Router, RouterOutlet } from "@angular/router";
import { AuthService } from "./services/auth.service/auth.service";
import { ThemeService } from "./services/theme.service/theme.service";

@Component({
  selector: "dash-root",
  templateUrl: "./app.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet]
})
export class AppComponent implements OnInit {
  public readonly title = "Dash";

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

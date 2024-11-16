import { ChangeDetectionStrategy, Component, OnInit, inject } from "@angular/core";
import { Router, RouterOutlet } from "@angular/router";
import { AuthService } from "./services/auth.service/auth.service";
import { ThemeService } from "./services/theme.service/theme.service";

export interface IMenu {
  link: string;
  icon: string;
}

@Component({
  selector: "dash-root",
  templateUrl: "./app.component.html",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [RouterOutlet]
})
export class AppComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  title = "Dash";

  public async ngOnInit(): Promise<void> {
    if (!this.authService.userHasValidToken()) {
      await this.router.navigate(["/login"]);
    }
    this.themeService.selectDarkMode(this.themeService.isPreferredThemeDarkMode());
  }
}

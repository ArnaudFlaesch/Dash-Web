import { Component, inject, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ThemeService } from "./core/theme/theme-service";

/** The redirection to the login page of a user without a valid token is done by the authGuard */
@Component({
  selector: "dash-root",
  templateUrl: "./app.html",
  imports: [RouterOutlet]
})
export class App implements OnInit {
  private readonly themeService = inject(ThemeService);

  public ngOnInit(): void {
    this.themeService.selectDarkMode(this.themeService.isPreferredThemeDarkMode());
  }
}

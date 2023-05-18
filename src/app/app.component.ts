import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service/auth.service';
import { ThemeService } from './services/theme.service/theme.service';

export interface IMenu {
  link: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Dash';

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private router: Router
  ) {
    this.initApplication();
  }

  private async initApplication(): Promise<void> {
    if (!this.authService.userHasValidToken()) {
      await this.navigateToLoginPage();
    }
    this.themeService.selectDarkMode(this.themeService.isPreferredThemeDarkMode());
  }

  private async navigateToLoginPage(): Promise<void> {
    await this.router.navigate(['/login']);
  }
}

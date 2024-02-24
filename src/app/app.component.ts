import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service/auth.service';
import { ThemeService } from './services/theme.service/theme.service';

export interface IMenu {
  link: string;
  icon: string;
}

@Component({
  selector: 'dash-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Dash';

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  public async ngOnInit(): Promise<void> {
    if (!this.authService.userHasValidToken()) {
      await this.router.navigate(['/login']);
    }
    this.themeService.selectDarkMode(this.themeService.isPreferredThemeDarkMode());
  }
}

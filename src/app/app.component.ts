import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service/auth.service';

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

  constructor(private authService: AuthService, private router: Router) {
    if (!this.authService.userHasValidToken()) {
      this.router.navigate(['/login']);
    }
  }
}

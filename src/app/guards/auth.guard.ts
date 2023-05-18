import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from './../services/auth.service/auth.service';

@Injectable()
export class AuthGuard {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(): boolean {
    return this.authService.userHasValidToken();
  }
}

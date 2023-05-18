import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service/auth.service';
import { ErrorHandlerService } from './../services/error.handler.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public isLoading = false;

  public inputUsername = '';
  public inputPassword = '';

  constructor(
    private authService: AuthService,
    private errorHandlerService: ErrorHandlerService,
    private router: Router
  ) {}

  public handleLogin(): void {
    if (this.inputUsername && this.inputPassword) {
      this.isLoading = true;
      this.authService.login(this.inputUsername, this.inputPassword).subscribe({
        next: async () => {
          this.isLoading = false;
          await this.router.navigate(['home']);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.errorHandlerService.handleLoginError(error);
        },
        complete: () => (this.isLoading = false)
      });
    } else {
      this.isLoading = false;
    }
  }

  public loginAsDemoAccount(): void {
    this.inputUsername = 'demo';
    this.inputPassword = 'demo';
    this.handleLogin();
  }
}

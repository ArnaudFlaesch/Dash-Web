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

  public async handleLogin(): Promise<void> {
    if (this.inputUsername && this.inputPassword) {
      this.isLoading = true;
      try {
        await this.authService.login(this.inputUsername, this.inputPassword);
        this.isLoading = false;
        await this.router.navigate(['home']);
      } catch (error) {
        this.isLoading = false;
        this.errorHandlerService.handleLoginError(error as Error);
      }
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

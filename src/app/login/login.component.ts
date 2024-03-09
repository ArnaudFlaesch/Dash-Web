import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service/auth.service';
import { ErrorHandlerService } from './../services/error.handler.service';
import { firstValueFrom } from 'rxjs';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { NgIf } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'dash-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: true,
    imports: [RouterLink, FormsModule, MatButton, NgIf, MatProgressSpinner]
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
        await firstValueFrom(this.authService.login(this.inputUsername, this.inputPassword));
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

  public async loginAsDemoAccount(): Promise<void> {
    this.inputUsername = 'demo';
    this.inputPassword = 'demo';
    await this.handleLogin();
  }
}

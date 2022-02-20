import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service/auth.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public logoPath = './../assets/logo.png';
  public isLoading = false;

  public inputUsername = '';
  public inputPassword = '';

  private ERROR_AUTHENTICATING_USER = "Erreur lors de la connexion de l'utilisateur.";

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  public handleLogin() {
    if (this.inputUsername && this.inputPassword) {
      this.isLoading = true;
      this.authService.login(this.inputUsername, this.inputPassword).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['home']);
        },
        error: (error: Error) => {
          this.isLoading = false;
          console.log(error.message);
          this.snackBar.open(this.ERROR_AUTHENTICATING_USER);
        },
        complete: () => (this.isLoading = false)
      });
    } else {
      this.isLoading = false;
    }
  }
}

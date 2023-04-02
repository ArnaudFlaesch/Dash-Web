import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable()
export class ErrorHandlerService {
  private ERROR_AUTHENTICATING_USER = "Erreur lors de la connexion de l'utilisateur.";

  private ERROR_UNAUTHORIZED_CODE =
    "Votre jeton d'authentification n'est plus valide, veuillez vous reconnecter.";

  private ERROR_FORBIDDEN_CODE =
    "Vous n'avez pas les droits nécessaires pour effectuer cette opération.";

  constructor(private router: Router, private snackbar: MatSnackBar) {}

  public handleError(error: HttpErrorResponse, messageToDisplay: string): void {
    switch (error.status) {
      case 401: {
        this.router
          .navigate(['login'])
          .then(() => this.displayErrorMessage(error.message, this.ERROR_UNAUTHORIZED_CODE));
        break;
      }
      case 403: {
        this.displayErrorMessage(error.message, this.ERROR_FORBIDDEN_CODE);
        break;
      }
      default: {
        this.displayErrorMessage(error.message, messageToDisplay);
      }
    }
  }

  public handleLoginError(error: HttpErrorResponse): void {
    this.displayErrorMessage(error.message, this.ERROR_AUTHENTICATING_USER);
  }

  private displayErrorMessage(errorMessage: string, messageToDisplay: string) {
    console.error(errorMessage);
    this.snackbar.open(messageToDisplay, undefined, { duration: 3000 });
  }
}

import { HttpErrorResponse } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";

@Injectable()
export class ErrorHandlerService {
  private readonly router = inject(Router);
  private readonly snackbar = inject(MatSnackBar);

  private readonly ERROR_AUTHENTICATING_USER = "Erreur lors de la connexion de l'utilisateur.";

  private readonly ERROR_UNAUTHORIZED_CODE =
    "Votre jeton d'authentification n'est plus valide, veuillez vous reconnecter.";

  private readonly ERROR_FORBIDDEN_CODE =
    "Vous n'avez pas les droits nécessaires pour effectuer cette opération.";

  public handleError(error: HttpErrorResponse, messageToDisplay: string): void {
    switch (error.status) {
      case 401: {
        this.router
          .navigate(["login"])
          .then(() => this.displayErrorMessage(error.message, this.ERROR_UNAUTHORIZED_CODE))
          .catch((error) => console.log(error));
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

  public handleLoginError(error: Error): void {
    this.displayErrorMessage(error.message, this.ERROR_AUTHENTICATING_USER);
  }

  private displayErrorMessage(errorMessage: string, messageToDisplay: string) {
    console.log(errorMessage);
    this.snackbar.open(messageToDisplay, undefined, { duration: 3000 });
  }
}

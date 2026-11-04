import { HttpErrorResponse } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";

@Service()
export class ErrorHandlerService {
  private static readonly ERROR_AUTHENTICATING_USER =
    "Erreur lors de la connexion de l'utilisateur.";

  private static readonly ERROR_UNAUTHORIZED =
    "Votre jeton d'authentification n'est plus valide, veuillez vous reconnecter.";

  private static readonly ERROR_FORBIDDEN =
    "Vous n'avez pas les droits nécessaires pour effectuer cette opération.";

  private static readonly SNACKBAR_DURATION = 3000;

  private readonly router = inject(Router);
  private readonly snackbar = inject(MatSnackBar);

  public handleError(error: HttpErrorResponse, messageToDisplay: string): void {
    switch (error.status) {
      case 401: {
        this.router
          .navigate(["login"])
          .then(() =>
            this.displayErrorMessage(error.message, ErrorHandlerService.ERROR_UNAUTHORIZED)
          )
          .catch((navigationError) => console.error(navigationError));
        break;
      }
      case 403: {
        this.displayErrorMessage(error.message, ErrorHandlerService.ERROR_FORBIDDEN);
        break;
      }
      default: {
        this.displayErrorMessage(error.message, messageToDisplay);
      }
    }
  }

  public handleLoginError(error: Error): void {
    this.displayErrorMessage(error.message, ErrorHandlerService.ERROR_AUTHENTICATING_USER);
  }

  private displayErrorMessage(errorMessage: string, messageToDisplay: string): void {
    console.error(errorMessage);
    this.snackbar.open(messageToDisplay, undefined, {
      duration: ErrorHandlerService.SNACKBAR_DURATION
    });
  }
}

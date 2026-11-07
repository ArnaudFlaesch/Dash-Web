import { HttpErrorResponse } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { AuthService } from "@core/auth/auth-service";

@Service()
export class ErrorHandlerService {
  private readonly ERROR_AUTHENTICATING_USER = "Erreur lors de la connexion de l'utilisateur.";

  private readonly ERROR_UNAUTHORIZED =
    "Votre jeton d'authentification n'est plus valide, veuillez vous reconnecter.";

  private readonly ERROR_FORBIDDEN =
    "Vous n'avez pas les droits nécessaires pour effectuer cette opération.";

  private readonly SNACKBAR_DURATION = 3000;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackbar = inject(MatSnackBar);

  public handleError(error: HttpErrorResponse, messageToDisplay: string): void {
    switch (error.status) {
      case 401: {
        // The rejected token is removed, else it would still be sent until it expires
        this.authService.logout();
        this.router
          .navigate(["login"])
          .then(() => this.displayErrorMessage(error.message, this.ERROR_UNAUTHORIZED))
          .catch((navigationError) => console.error(navigationError));
        break;
      }
      case 403: {
        this.displayErrorMessage(error.message, this.ERROR_FORBIDDEN);
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

  private displayErrorMessage(errorMessage: string, messageToDisplay: string): void {
    console.error(errorMessage);
    this.snackbar.open(messageToDisplay, undefined, {
      duration: this.SNACKBAR_DURATION
    });
  }
}

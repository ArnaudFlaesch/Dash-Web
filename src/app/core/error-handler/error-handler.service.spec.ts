import { HttpErrorResponse } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { Mock, vi } from "vitest";
import { ErrorHandlerService } from "./error-handler.service";

describe("ErrorHandlerService", () => {
  let errorHandlerService: ErrorHandlerService;
  let openSpy: Mock;
  let navigateSpy: Mock;

  const messageToDisplay = "Erreur lors de la récupération des données.";
  const snackbarConfig = { duration: 3000 };

  beforeEach(() => {
    openSpy = vi.fn();
    navigateSpy = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: MatSnackBar, useValue: { open: openSpy } },
        { provide: Router, useValue: { navigate: navigateSpy } }
      ]
    });
    errorHandlerService = TestBed.inject(ErrorHandlerService);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createError(status: number): HttpErrorResponse {
    return new HttpErrorResponse({ status, statusText: "Error", url: "http://localhost/api" });
  }

  it("Should display the given message for a server error", () => {
    const error = createError(500);
    errorHandlerService.handleError(error, messageToDisplay);
    expect(console.error).toHaveBeenCalledWith(error.message);
    expect(openSpy).toHaveBeenCalledWith(messageToDisplay, undefined, snackbarConfig);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("Should redirect to the login page when the token is no longer valid", async () => {
    errorHandlerService.handleError(createError(401), messageToDisplay);
    expect(navigateSpy).toHaveBeenCalledWith(["login"]);
    await vi.waitFor(() => expect(openSpy).toHaveBeenCalled());
    expect(openSpy).toHaveBeenCalledWith(
      "Votre jeton d'authentification n'est plus valide, veuillez vous reconnecter.",
      undefined,
      snackbarConfig
    );
  });

  it("Should log the navigation error when the redirection to the login page fails", async () => {
    const navigationError = new Error("Navigation failed");
    navigateSpy.mockRejectedValue(navigationError);
    errorHandlerService.handleError(createError(401), messageToDisplay);
    await vi.waitFor(() => expect(console.error).toHaveBeenCalledWith(navigationError));
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("Should display a specific message when the user is not allowed", () => {
    errorHandlerService.handleError(createError(403), messageToDisplay);
    expect(openSpy).toHaveBeenCalledWith(
      "Vous n'avez pas les droits nécessaires pour effectuer cette opération.",
      undefined,
      snackbarConfig
    );
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("Should display a specific message when the login fails", () => {
    errorHandlerService.handleLoginError(new Error("Bad credentials"));
    expect(console.error).toHaveBeenCalledWith("Bad credentials");
    expect(openSpy).toHaveBeenCalledWith(
      "Erreur lors de la connexion de l'utilisateur.",
      undefined,
      snackbarConfig
    );
  });
});

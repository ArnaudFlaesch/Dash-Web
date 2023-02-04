import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable()
export class ErrorHandlerService {
  constructor(private router: Router, private snackbar: MatSnackBar) {}

  public handleError(error: HttpErrorResponse, messageToDisplay: string): void {
    if (error.status == 401) {
      this.router
        .navigate(['login'])
        .then(() => this.displayErrorMessage(error.message, messageToDisplay));
    } else {
      this.displayErrorMessage(error.message, messageToDisplay);
    }
  }

  private displayErrorMessage(errorMessage: string, messageToDisplay: string) {
    console.error(errorMessage);
    this.snackbar.open(messageToDisplay, undefined, { duration: 3000 });
  }
}

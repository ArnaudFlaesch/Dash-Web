import { Component, inject, signal } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthService } from "../services/auth.service/auth.service";
import { ErrorHandlerService } from "../services/error.handler.service";
import { requiredText } from "../utils/form-validators";

@Component({
  selector: "dash-login",
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.scss",
  imports: [
    RouterLink,
    MatButton,
    MatIconButton,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatSuffix,
    MatIcon,
    MatInput,
    MatProgressSpinner,
    FormField
  ]
})
export class LoginComponent {
  public readonly isLoading = signal(false);
  public readonly isPasswordVisible = signal(false);

  public readonly credentials = signal({ username: "", password: "" });
  public readonly loginForm = form(this.credentials, (path) => {
    requiredText(path.username);
    requiredText(path.password);
  });

  public readonly authService = inject(AuthService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly router = inject(Router);

  public async handleLogin(): Promise<void> {
    if (this.loginForm().invalid()) {
      return;
    }
    const { username, password } = this.credentials();
    this.isLoading.set(true);
    try {
      await firstValueFrom(this.authService.login(username, password));
      await this.router.navigate(["home"]);
    } catch (error) {
      this.errorHandlerService.handleLoginError(error as Error);
    } finally {
      this.isLoading.set(false);
    }
  }

  public async loginAsDemoAccount(): Promise<void> {
    this.credentials.set({ username: "demo", password: "demo" });
    await this.handleLogin();
  }
}

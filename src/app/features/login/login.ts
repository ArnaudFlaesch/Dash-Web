import { NgOptimizedImage } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthService } from "@core/auth/auth-service";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { requiredText } from "@shared/forms/form-validators";

@Component({
  selector: "dash-login",
  templateUrl: "./login.html",
  styleUrl: "./login.scss",
  imports: [
    NgOptimizedImage,
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
export class Login {
  protected readonly labels = {
    logoAlt: "dash logo",
    title: "Dash",
    subtitle: "Votre tableau de bord personnel",
    usernameLabel: "Nom d'utilisateur",
    username: "Username",
    passwordLabel: "Mot de passe",
    password: "Password",
    hidePassword: "Masquer le mot de passe",
    showPassword: "Afficher le mot de passe",
    login: "Se connecter",
    or: "ou",
    tryDemo: "Essayer la démo"
  };

  protected readonly isLoading = signal(false);
  protected readonly isPasswordVisible = signal(false);

  private readonly credentials = signal({ username: "", password: "" });
  protected readonly loginForm = form(this.credentials, (path) => {
    requiredText(path.username);
    requiredText(path.password);
  });

  private readonly authService = inject(AuthService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly router = inject(Router);

  protected async login(): Promise<void> {
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

  protected async loginAsDemoAccount(): Promise<void> {
    this.credentials.set({ username: "demo", password: "demo" });
    await this.login();
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthService } from "../services/auth.service/auth.service";
import { ErrorHandlerService } from "../services/error.handler.service";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "dash-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButton, MatProgressSpinner, FormsModule]
})
export class LoginComponent {
  public readonly isLoading = signal(false);

  public readonly inputUsername = signal("");
  public readonly inputPassword = signal("");

  public authService = inject(AuthService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly router = inject(Router);

  public async handleLogin(): Promise<void> {
    const username = this.inputUsername();
    const password = this.inputPassword();
    if (username && password) {
      this.isLoading.set(true);
      try {
        await firstValueFrom(this.authService.login(username, password));
        this.isLoading.set(false);
        await this.router.navigate(["home"]);
      } catch (error) {
        this.isLoading.set(false);
        this.errorHandlerService.handleLoginError(error as Error);
      }
    }
  }

  public async loginAsDemoAccount(): Promise<void> {
    this.inputUsername.set("demo");
    this.inputPassword.set("demo");
    await this.handleLogin();
  }
}

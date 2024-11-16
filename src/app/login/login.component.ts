import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthService } from "../services/auth.service/auth.service";
import { ErrorHandlerService } from "./../services/error.handler.service";

@Component({
  selector: "dash-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, MatButton, MatProgressSpinner]
})
export class LoginComponent {
  public isLoading = false;

  public inputUsername = "";
  public inputPassword = "";

  public authService = inject(AuthService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly router = inject(Router);

  public async handleLogin(): Promise<void> {
    if (this.inputUsername && this.inputPassword) {
      this.isLoading = true;
      try {
        await firstValueFrom(this.authService.login(this.inputUsername, this.inputPassword));
        this.isLoading = false;
        await this.router.navigate(["home"]);
      } catch (error) {
        this.isLoading = false;
        this.errorHandlerService.handleLoginError(error as Error);
      }
    }
  }

  public async loginAsDemoAccount(): Promise<void> {
    this.inputUsername = "demo";
    this.inputPassword = "demo";
    await this.handleLogin();
  }
}

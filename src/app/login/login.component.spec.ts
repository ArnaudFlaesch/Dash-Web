import { FormsModule } from "@angular/forms";

import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { provideRouter } from "@angular/router";
import { environment } from "../../environments/environment";
import { HomeComponent } from "../home/home.component";
import { AuthService } from "./../services/auth.service/auth.service";
import { ErrorHandlerService } from "./../services/error.handler.service";
import { LoginComponent } from "./login.component";

describe("LoginComponent", () => {
  let component: LoginComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, MatProgressSpinnerModule, NoopAnimationsModule],
      providers: [
        provideRouter([
          {
            path: "login",
            component: LoginComponent
          },
          {
            path: "home",
            component: HomeComponent
          }
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        ErrorHandlerService
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("Should prevent login", () => {
    expect(component.inputUsername).toBe("");
    expect(component.inputPassword).toBe("");
    component.handleLogin();
  });

  it("Should login as demo", () => {
    const userData = {
      accessToken: "accessToken",
      id: 2,
      username: "admintest",
      email: "admin@email.com",
      roles: ["ROLE_ADMIN"],
      tokenType: "Bearer"
    };
    component.loginAsDemoAccount();
    const request = httpTestingController.expectOne(environment.backend_url + "/auth/login");
    request.flush(userData);
  });

  it("Should fail to login with wrong credentials", () => {
    const userName = "userName";

    component.inputUsername = userName;
    component.inputPassword = "password";
    component.handleLogin();
    const request = httpTestingController.expectOne(environment.backend_url + "/auth/login");
    request.flush("Bad credentials", {
      status: 400,
      statusText: "Bad Request"
    });
  });
});

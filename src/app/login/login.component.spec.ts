import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { environment } from "../../environments/environment";
import { HomeComponent } from "../home/home.component";
import { AuthService } from "../services/auth.service/auth.service";
import { ErrorHandlerService } from "../services/error.handler.service";
import { LoginComponent } from "./login.component";
import { vi } from "vitest";

describe("LoginComponent", () => {
  let component: LoginComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
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
    const loginSpy = vi.spyOn(component.authService, "login");
    expect(component.credentials()).toEqual({ username: "", password: "" });
    expect(component.loginForm().invalid()).toBe(true);
    component.handleLogin();
    expect(loginSpy).toHaveBeenCalledTimes(0);
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
    const loginSpy = vi.spyOn(component.authService, "login");
    component.loginAsDemoAccount();
    const request = httpTestingController.expectOne(environment.backend_url + "/auth/login");
    request.flush(userData);
    expect(loginSpy).toHaveBeenCalledWith("demo", "demo");
  });

  it("Should fail to login with wrong credentials", async () => {
    const userName = "userName";
    const handleLoginErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleLoginError");

    component.credentials.set({ username: userName, password: "password" });
    const login = component.handleLogin();
    const request = httpTestingController.expectOne(environment.backend_url + "/auth/login");
    request.flush("Bad credentials", {
      status: 400,
      statusText: "Bad Request"
    });
    await login;

    expect(handleLoginErrorSpy).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
  });
});

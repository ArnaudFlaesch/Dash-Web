import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { environment } from "@environments/environment";
import { Home } from "@features/home/home";
import { AuthService } from "@core/auth/auth-service";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { Login } from "./login";
import { vi } from "vitest";

describe("Login", () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let httpTestingController: HttpTestingController;

  const loginUrl = environment.backend_url + "/auth/login";

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: "login",
            component: Login
          },
          {
            path: "home",
            component: Home
          }
        ]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.removeItem("user");
  });

  function getElement<T extends HTMLElement>(selector: string): T {
    return (fixture.nativeElement as HTMLElement).querySelector(selector) as T;
  }

  async function typeInInput(selector: string, value: string): Promise<void> {
    const input = getElement<HTMLInputElement>(selector);
    input.value = value;
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();
  }

  it("Should prevent login", () => {
    const loginSpy = vi.spyOn(TestBed.inject(AuthService), "login");
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
    const loginSpy = vi.spyOn(TestBed.inject(AuthService), "login");
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

  it("Should display the login form with the login button disabled", async () => {
    await fixture.whenStable();
    expect(getElement("#login-page-title").textContent?.trim()).toEqual(component.labels.title);
    expect(getElement("#login-page-subtitle").textContent?.trim()).toEqual(
      component.labels.subtitle
    );
    expect(getElement("#dash-logo").getAttribute("alt")).toEqual(component.labels.logoAlt);
    expect(getElement("#input-username").getAttribute("placeholder")).toEqual(
      component.labels.username
    );
    expect(getElement("#input-password").getAttribute("placeholder")).toEqual(
      component.labels.password
    );
    expect(getElement("#login-separator").textContent?.trim()).toEqual(component.labels.or);
    expect(getElement("#login-button-label").textContent?.trim()).toEqual(component.labels.login);
    expect(getElement<HTMLButtonElement>("#login-button").disabled).toBe(true);
    expect(getElement("mat-spinner")).toBeNull();
  });

  it("Should show and hide the password", async () => {
    await fixture.whenStable();
    const passwordInput = getElement<HTMLInputElement>("#input-password");
    const toggleButton = getElement<HTMLButtonElement>("button[matSuffix]");
    expect(passwordInput.type).toEqual("password");
    expect(toggleButton.getAttribute("aria-label")).toEqual(component.labels.showPassword);

    toggleButton.click();
    await fixture.whenStable();
    expect(passwordInput.type).toEqual("text");
    expect(toggleButton.getAttribute("aria-label")).toEqual(component.labels.hidePassword);
    expect(toggleButton.textContent?.trim()).toEqual("visibility_off");

    toggleButton.click();
    await fixture.whenStable();
    expect(passwordInput.type).toEqual("password");
  });

  it("Should keep the login button disabled when the username is blank", async () => {
    await fixture.whenStable();
    await typeInInput("#input-username", "   ");
    await typeInInput("#input-password", "password");
    expect(getElement<HTMLButtonElement>("#login-button").disabled).toBe(true);
  });

  it("Should log in with the typed credentials then go to the home page", async () => {
    const navigateSpy = vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);
    await fixture.whenStable();
    await typeInInput("#input-username", "admin");
    await typeInInput("#input-password", "password");
    const loginButton = getElement<HTMLButtonElement>("#login-button");
    expect(loginButton.disabled).toBe(false);

    loginButton.click();
    await fixture.whenStable();
    expect(component.isLoading()).toBe(true);
    expect(getElement("mat-spinner")).not.toBeNull();
    expect(loginButton.disabled).toBe(true);

    const request = httpTestingController.expectOne(loginUrl);
    expect(request.request.body).toEqual({ username: "admin", password: "password" });
    request.flush({ id: 1, username: "admin", accessToken: "token", roles: [] });
    await vi.waitFor(() => expect(navigateSpy).toHaveBeenCalledWith(["home"]));
    await fixture.whenStable();
    expect(component.isLoading()).toBe(false);
    expect(getElement("mat-spinner")).toBeNull();
  });

  it("Should log in with the demo account from the demo button", async () => {
    vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);
    await fixture.whenStable();
    const demoButton = getElement<HTMLButtonElement>("button[mat-stroked-button]");
    expect(demoButton.textContent).toContain(component.labels.tryDemo);

    demoButton.click();
    const request = httpTestingController.expectOne(loginUrl);
    expect(request.request.body).toEqual({ username: "demo", password: "demo" });
    request.flush({ id: 2, username: "demo", accessToken: "token", roles: [] });
  });
});

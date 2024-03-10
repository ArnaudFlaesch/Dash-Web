import { FormsModule } from '@angular/forms';

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { environment } from '../../environments/environment';
import { AuthService } from './../services/auth.service/auth.service';
import { ErrorHandlerService } from './../services/error.handler.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MatProgressSpinnerModule,
        RouterTestingModule,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [AuthService, ErrorHandlerService]
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('Should prevent login', () => {
    const loginSpy = jest.spyOn(component.authService, 'login');
    expect(component.inputUsername).toBe('');
    expect(component.inputPassword).toBe('');
    component.handleLogin();
    expect(loginSpy).toHaveBeenCalledTimes(0);
  });

  it('Should login as demo', () => {
    const userData = {
      accessToken: 'accessToken',
      id: 2,
      username: 'admintest',
      email: 'admin@email.com',
      roles: ['ROLE_ADMIN'],
      tokenType: 'Bearer'
    };
    const loginSpy = jest.spyOn(component.authService, 'login');
    component.loginAsDemoAccount();
    const request = httpTestingController.expectOne(environment.backend_url + '/auth/login');
    request.flush(userData);
    expect(loginSpy).toHaveBeenCalledWith('demo', 'demo');
  });

  it('Should fail to login with wrong credentials', () => {
    const userName = 'userName';

    component.inputUsername = userName;
    component.inputPassword = 'password';
    component.handleLogin();
    const request = httpTestingController.expectOne(environment.backend_url + '/auth/login');
    request.flush('Bad credentials', {
      status: 400,
      statusText: 'Bad Request'
    });
  });
});

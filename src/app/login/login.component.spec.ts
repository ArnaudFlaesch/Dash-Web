import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createHttpFactory,
  createRoutingFactory,
  HttpMethod,
  SpectatorRouting,
  SpectatorHttp
} from '@ngneat/spectator/jest';

import { environment } from '../../environments/environment';
import { AuthService } from './../services/auth.service/auth.service';
import { ErrorHandlerService } from './../services/error.handler.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let spectator: SpectatorRouting<LoginComponent>;
  let authService: SpectatorHttp<AuthService>;

  const createComponent = createRoutingFactory({
    component: LoginComponent,
    imports: [HttpClientModule, FormsModule, MatSnackBarModule],
    providers: [AuthService, ErrorHandlerService]
  });
  const createHttp = createHttpFactory(AuthService);

  beforeEach(() => {
    spectator = createComponent();
    authService = createHttp();
  });

  it('Should display the title', () => {
    spectator.fixture.detectChanges();
    expect(spectator.query('h1')?.textContent).toEqual('Dash');
  });

  it('Should prevent login', () => {
    const loginSpy = jest.spyOn(authService.service, 'login');
    expect(spectator.component.inputUsername).toBe('');
    expect(spectator.component.inputPassword).toBe('');
    spectator.component.handleLogin();
    expect(loginSpy).toHaveBeenCalledTimes(0);
    spectator.fixture.detectChanges();
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
    const loginSpy = jest.spyOn(authService.service, 'login');
    spectator.component.loginAsDemoAccount();
    const request = authService.expectOne(environment.backend_url + '/auth/login', HttpMethod.POST);
    request.flush(userData);
    spectator.fixture.detectChanges();
    expect(loginSpy).toHaveBeenCalledWith('demo', 'demo');
  });

  it('Should fail to login with wrong credentials', () => {
    const userName = 'userName';

    spectator.component.inputUsername = userName;
    spectator.component.inputPassword = 'password';
    spectator.component.handleLogin();
    const request = authService.expectOne(environment.backend_url + '/auth/login', HttpMethod.POST);
    request.flush('Bad credentials', {
      status: 400,
      statusText: 'Bad Request'
    });
  });
});

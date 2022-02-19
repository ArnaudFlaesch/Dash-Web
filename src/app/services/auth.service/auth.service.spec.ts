import {
  createHttpFactory,
  HttpMethod,
  SpectatorHttp
} from '@ngneat/spectator';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

describe('ApiService tests', () => {
  let spectator: SpectatorHttp<AuthService>;
  const createSpectator = createHttpFactory({
    service: AuthService
  });

  const expectedUserData: Record<string, unknown> = {
    accessToken: 'access_token',
    id: 2,
    username: 'admintest',
    email: 'admin@email.com',
    roles: ['ROLE_ADMIN'],
    tokenType: 'Bearer'
  };

  const loginPath = '/auth/login';

  beforeEach(() => (spectator = createSpectator()));

  it("Devrait renvoyer les données d'un utilisateur", () => {
    spectator.service
      .login('login', 'password')
      .subscribe((response) => expect(response).toEqual(expectedUserData));

    const request = spectator.expectOne(
      environment.backend_url + loginPath,
      HttpMethod.POST
    );
    request.flush(expectedUserData);
  });

  it('Devrait ne rien renvoyer', () => {
    spectator.service
      .login('login', 'password')
      .subscribe((response) => expect(response).toBe(null));
    const request = spectator.expectOne(
      environment.backend_url + loginPath,
      HttpMethod.POST
    );
    request.flush(null);
  });
});

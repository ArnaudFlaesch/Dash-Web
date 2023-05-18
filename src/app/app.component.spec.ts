import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { SpectatorRouting, createRoutingFactory } from '@ngneat/spectator/jest';

import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service/auth.service';
import { ThemeService } from './services/theme.service/theme.service';

describe('AppComponent', () => {
  let spectator: SpectatorRouting<AppComponent>;

  const createComponent = createRoutingFactory({
    component: AppComponent,
    imports: [HttpClientModule, RouterTestingModule],
    providers: [AuthService, ThemeService]
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create the app', () => {
    expect(spectator.component).toBeTruthy();
    expect(spectator.component.title).toEqual('Dash');
  });
});

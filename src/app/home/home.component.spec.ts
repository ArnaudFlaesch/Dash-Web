import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator';
import { environment } from '../../environments/environment';
import { AuthService } from './../services/auth.service/auth.service';
import { TabService } from './../services/tab.service/tab.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let spectator: Spectator<HomeComponent>;
  let tabService: SpectatorHttp<TabService>;

  const tabPath = '/tab/';

  const createComponent = createComponentFactory({
    component: HomeComponent,
    imports: [HttpClientTestingModule, MatSnackBarModule, RouterTestingModule],
    providers: [AuthService, TabService]
  });
  const createHttp = createHttpFactory(TabService);

  const tabData = [
    { id: 1, label: 'Flux RSS', tabOrder: 1 },
    { id: 2, label: 'Météo', tabOrder: 2 }
  ];

  beforeEach(() => {
    spectator = createComponent();
    tabService = createHttp();
  });

  it('should create the app', () => {
    expect(spectator.component).toBeTruthy();
    expect(spectator.component.tabs).toEqual([]);
    const request = tabService.expectOne(
      environment.backend_url + tabPath,
      HttpMethod.GET
    );
    request.flush(tabData);
    spectator.fixture.detectChanges();
    expect(spectator.component.tabs).toEqual(tabData);
  });
});

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TabService } from './../services/tab.service/tab.service';
import { AuthService } from './../services/auth.service/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator';
import { HomeComponent } from './home.component';
import { HttpClientModule } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { environment } from '../../environments/environment';

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

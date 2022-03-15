import { ITab } from './../model/Tab';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ErrorHandlerService } from './../services/error.handler.service';
import { ConfigService } from './../services/config.service/config.service';
import { MatDialogModule } from '@angular/material/dialog';
import { WidgetService } from './../services/widget.service/widget.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { environment } from '../../environments/environment';
import { AuthService } from './../services/auth.service/auth.service';
import { TabService } from './../services/tab.service/tab.service';
import { HomeComponent } from './home.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('HomeComponent', () => {
  let spectator: Spectator<HomeComponent>;
  let tabService: SpectatorHttp<TabService>;
  let widgetService: SpectatorHttp<WidgetService>;

  const tabPath = '/tab/';

  const createComponent = createComponentFactory({
    component: HomeComponent,
    imports: [HttpClientTestingModule, RouterTestingModule, MatDialogModule, MatSnackBarModule],
    providers: [AuthService, TabService, WidgetService, ConfigService, ErrorHandlerService],
    schemas: [NO_ERRORS_SCHEMA]
  });
  const createTabHttp = createHttpFactory(TabService);
  const createWidgetHttp = createHttpFactory(WidgetService);

  const tabData = [
    { id: 1, label: 'Flux RSS', tabOrder: 1 },
    { id: 2, label: 'Météo', tabOrder: 2 }
  ];

  beforeEach(() => {
    spectator = createComponent();
    tabService = createTabHttp();
    widgetService = createWidgetHttp();
  });

  it('should create the app', () => {
    expect(spectator.component.tabs).toEqual([]);
    const request = tabService.expectOne(environment.backend_url + tabPath, HttpMethod.GET);
    request.flush(tabData);
    expect(spectator.component.tabs).toEqual(tabData);
    widgetService.expectOne(
      environment.backend_url + '/widget/?tabId=' + spectator.component.activeTab,
      HttpMethod.GET
    );
    expect(spectator.component.tabs.length).toEqual(2);
    tabService.controller.verify();
  });

  it('Should create a tab from an empty dashboard', () => {
    expect(spectator.component.tabs).toEqual([]);
    const getTabsRequest = tabService.expectOne(environment.backend_url + tabPath, HttpMethod.GET);
    getTabsRequest.flush([]);
    spectator.component.addNewTab();
    const createTabRequest = tabService.expectOne(
      environment.backend_url + tabPath + 'addTab',
      HttpMethod.POST
    );
    const newTabData = { id: 1, label: 'Nouvel onglet', tabOrder: 1 } as ITab;
    createTabRequest.flush(newTabData);
    expect(spectator.component.tabs.length).toEqual(1);
  });
});

import { IWidgetConfig } from './../model/IWidgetConfig';
import { WidgetTypes } from './../enums/WidgetsEnum';
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
    imports: [
      HttpClientTestingModule,
      RouterTestingModule,
      MatDialogModule,
      MatSnackBarModule
    ],
    providers: [
      AuthService,
      TabService,
      WidgetService,
      ConfigService,
      ErrorHandlerService
    ],
    schemas: [NO_ERRORS_SCHEMA]
  });
  const createTabHttp = createHttpFactory(TabService);
  const createWidgetHttp = createHttpFactory(WidgetService);

  const tabData = [
    { id: 1, label: 'Flux RSS', tabOrder: 1 },
    { id: 2, label: 'Météo', tabOrder: 2 }
  ];

  const firstTabWidgetData = [
    {
      id: 1,
      type: WidgetTypes.RSS,
      data: { url: 'url.rss.xml' },
      tabId: 1,
      widgetOrder: 1
    },
    {
      id: 2,
      type: WidgetTypes.RSS,
      data: { url: 'url.rss.xml' },
      tabId: 1,
      widgetOrder: 2
    }
  ] as IWidgetConfig[];

  beforeEach(() => {
    spectator = createComponent();
    tabService = createTabHttp();
    widgetService = createWidgetHttp();
  });

  it('Should display two tabs with two widgets on the first one', () => {
    expect(spectator.component.tabs).toEqual([]);
    const request = tabService.expectOne(
      environment.backend_url + tabPath,
      HttpMethod.GET
    );
    request.flush(tabData);
    expect(spectator.component.tabs).toEqual(tabData);
    const getWidgetsRequest = widgetService.expectOne(
      environment.backend_url +
        '/widget/?tabId=' +
        spectator.component.activeTab,
      HttpMethod.GET
    );
    getWidgetsRequest.flush(firstTabWidgetData);
    expect(spectator.component.tabs.length).toEqual(2);
    expect(spectator.component.activeWidgets.length).toEqual(2);
    expect(spectator.component.activeTab).toEqual(tabData[0].id);

    // Select second tab
    spectator.component.selectTab(tabData[1].id);
    expect(spectator.component.activeTab).toEqual(tabData[1].id);
    const getSecondTabWidgetsRequest = widgetService.expectOne(
      environment.backend_url +
        '/widget/?tabId=' +
        spectator.component.activeTab,
      HttpMethod.GET
    );
    getSecondTabWidgetsRequest.flush([]);
  });

  it('Should create a tab from an empty dashboard', () => {
    expect(spectator.component.tabs).toEqual([]);
    const getTabsRequest = tabService.expectOne(
      environment.backend_url + tabPath,
      HttpMethod.GET
    );
    getTabsRequest.flush([]);
    const createTabRequest = tabService.expectOne(
      environment.backend_url + tabPath + 'addTab',
      HttpMethod.POST
    );
    const newTabData = { id: 1, label: 'Nouvel onglet', tabOrder: 1 } as ITab;
    createTabRequest.flush(newTabData);
    expect(spectator.component.tabs.length).toEqual(1);
  });

  it('Should display two tabs then delete a widget and the second tab', () => {
    const request = tabService.expectOne(
      environment.backend_url + tabPath,
      HttpMethod.GET
    );
    request.flush(tabData);
    expect(spectator.component.tabs).toEqual(tabData);
    const getWidgetsRequest = widgetService.expectOne(
      environment.backend_url +
        '/widget/?tabId=' +
        spectator.component.activeTab,
      HttpMethod.GET
    );
    getWidgetsRequest.flush(firstTabWidgetData);
    expect(spectator.component.tabs.length).toEqual(2);
    expect(spectator.component.activeWidgets.length).toEqual(2);

    // Delete second widget
    const widgetIdToDelete = spectator.component.activeWidgets[1].id;
    spectator.component.deleteWidgetFromDashboard(widgetIdToDelete);
    const deleteWidgetRequest = widgetService.expectOne(
      environment.backend_url + '/widget/deleteWidget/?id=' + widgetIdToDelete,
      HttpMethod.DELETE
    );
    deleteWidgetRequest.flush(null, { status: 200, statusText: 'OK' });
    expect(spectator.component.activeWidgets.length).toEqual(1);

    // Delete second tab
    const tabIdToDelete = spectator.component.tabs[1].id;
    spectator.component.deleteTabFromDash(tabIdToDelete);
    const deleteTabRequest = widgetService.expectOne(
      environment.backend_url + '/tab/deleteTab/?id=' + tabIdToDelete,
      HttpMethod.DELETE
    );
    deleteTabRequest.flush(null, { status: 200, statusText: 'OK' });
    expect(spectator.component.tabs.length).toEqual(1);
  });

  it('Should delete the last tab and select the first after', () => {
    const tabsFromDatabase = [
      { id: 1, label: 'Home', tabOrder: 1 },
      { id: 2, label: 'RSS', tabOrder: 2 },
      { id: 3, label: 'Weather', tabOrder: 3 }
    ];

    const getTabsRequest = tabService.expectOne(
      environment.backend_url + '/tab/',
      HttpMethod.GET
    );
    getTabsRequest.flush(tabsFromDatabase);

    const getWidgetsRequest = widgetService.expectOne(
      environment.backend_url +
        '/widget/?tabId=' +
        spectator.component.activeTab,
      HttpMethod.GET
    );
    getWidgetsRequest.flush([]);
    expect(spectator.component.activeTab).toEqual(tabsFromDatabase[0].id);
  });

  it('Should delete the first tab and select the second after', () => {
    const tabsFromDatabase = [
      { id: 1, label: 'Home', tabOrder: 1 },
      { id: 2, label: 'RSS', tabOrder: 2 },
      { id: 3, label: 'Weather', tabOrder: 3 }
    ];

    const getTabsRequest = tabService.expectOne(
      environment.backend_url + '/tab/',
      HttpMethod.GET
    );
    getTabsRequest.flush(tabsFromDatabase);

    const getWidgetsRequest = widgetService.expectOne(
      environment.backend_url +
        '/widget/?tabId=' +
        spectator.component.activeTab,
      HttpMethod.GET
    );
    getWidgetsRequest.flush([]);

    const tabIdToDelete = spectator.component.tabs[0].id;
    spectator.component.deleteTabFromDash(tabIdToDelete);
    const deleteTabRequest = widgetService.expectOne(
      environment.backend_url + '/tab/deleteTab/?id=' + tabIdToDelete,
      HttpMethod.DELETE
    );
    deleteTabRequest.flush(null);

    const getTabWidgetsRequest = widgetService.expectOne(
      environment.backend_url +
        '/widget/?tabId=' +
        spectator.component.activeTab,
      HttpMethod.GET
    );
    getTabWidgetsRequest.flush([]);

    expect(spectator.component.activeTab).toEqual(
      spectator.component.tabs[0].id
    );
  });

  it('Should delete the active tab and select the first one after', () => {
    const tabsFromDatabase = [
      { id: 1, label: 'Home', tabOrder: 1 },
      { id: 2, label: 'RSS', tabOrder: 2 },
      { id: 3, label: 'Weather', tabOrder: 3 }
    ];

    const getTabsRequest = tabService.expectOne(
      environment.backend_url + '/tab/',
      HttpMethod.GET
    );
    getTabsRequest.flush(tabsFromDatabase);

    const getWidgetsRequest = widgetService.expectOne(
      environment.backend_url +
        '/widget/?tabId=' +
        spectator.component.activeTab,
      HttpMethod.GET
    );
    getWidgetsRequest.flush([]);

    spectator.component.selectTab(spectator.component.tabs[1].id);

    const getSecondTabWidgetsRequest = widgetService.expectOne(
      environment.backend_url +
        '/widget/?tabId=' +
        spectator.component.tabs[1].id,
      HttpMethod.GET
    );
    getSecondTabWidgetsRequest.flush([]);

    const tabIdToDelete = spectator.component.activeTab;

    spectator.component.deleteTabFromDash(tabIdToDelete);
    const deleteTabRequest = widgetService.expectOne(
      environment.backend_url + '/tab/deleteTab/?id=' + tabIdToDelete,
      HttpMethod.DELETE
    );
    deleteTabRequest.flush(null);

    const getTabWidgetRequest = widgetService.expectOne(
      environment.backend_url +
        '/widget/?tabId=' +
        spectator.component.activeTab,
      HttpMethod.GET
    );
    getTabWidgetRequest.flush([]);
    expect(spectator.component.activeTab).toEqual(tabsFromDatabase[0].id);
  });

  it('Should create a new tab when the last one is deleted', () => {
    const tabsFromDatabase = [{ id: 1, label: 'Home', tabOrder: 1 }];

    const getTabsRequest = tabService.expectOne(
      environment.backend_url + '/tab/',
      HttpMethod.GET
    );
    getTabsRequest.flush(tabsFromDatabase);

    const getWidgetsRequest = widgetService.expectOne(
      environment.backend_url +
        '/widget/?tabId=' +
        spectator.component.activeTab,
      HttpMethod.GET
    );
    getWidgetsRequest.flush([]);

    const lastTabToDelete = spectator.component.activeTab;
    spectator.component.deleteTabFromDash(lastTabToDelete);
    const deleteLastTabRequest = tabService.expectOne(
      environment.backend_url + '/tab/deleteTab/?id=' + lastTabToDelete,
      HttpMethod.DELETE
    );
    deleteLastTabRequest.flush(null);

    const addNewTabRequest = tabService.expectOne(
      environment.backend_url + '/tab/addTab',
      HttpMethod.POST
    );
    const newTabId = 5;
    addNewTabRequest.flush({
      id: newTabId,
      label: 'Nouvel onglet',
      tabOrder: 4
    } as ITab);

    expect(spectator.component.tabs.map((tab) => tab.id)).toEqual([newTabId]);
  });
});

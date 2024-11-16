import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { MatSnackBarModule } from "@angular/material/snack-bar";

import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { environment } from "../../environments/environment";
import { WidgetTypeEnum } from "./../enums/WidgetTypeEnum";
import { IWidgetConfig } from "./../model/IWidgetConfig";
import { AuthService } from "./../services/auth.service/auth.service";
import { ConfigService } from "./../services/config.service/config.service";
import { ErrorHandlerService } from "./../services/error.handler.service";
import { TabService } from "./../services/tab.service/tab.service";
import { ThemeService } from "./../services/theme.service/theme.service";
import { WidgetService } from "./../services/widget.service/widget.service";
import { HomeComponent } from "./home.component";

describe("HomeComponent", () => {
  let component: HomeComponent;
  let httpTestingController: HttpTestingController;

  const tabPath = "/tab/";

  const tabData = [
    { id: 1, label: "Flux RSS", tabOrder: 1 },
    { id: 2, label: "Météo", tabOrder: 2 }
  ];

  const firstTabWidgetData = [
    {
      id: 1,
      type: WidgetTypeEnum.RSS,
      data: { url: "url.rss.xml" },
      tabId: 1,
      widgetOrder: 1
    },
    {
      id: 2,
      type: WidgetTypeEnum.RSS,
      data: { url: "url.rss.xml" },
      tabId: 1,
      widgetOrder: 2
    }
  ] as IWidgetConfig[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule, MatSnackBarModule],
      providers: [
        provideRouter([
          {
            path: "home",
            component: HomeComponent
          }
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        TabService,
        WidgetService,
        ConfigService,
        ErrorHandlerService,
        ThemeService
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("Should display two tabs with two widgets on the first one", () => {
    expect(component.tabs).toEqual([]);
    const request = httpTestingController.expectOne(environment.backend_url + tabPath);
    request.flush(tabData);
    expect(component.tabs).toEqual(tabData);
    const getWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab}`
    );
    getWidgetsRequest.flush(firstTabWidgetData);
    expect(component.tabs.length).toEqual(2);
    expect(component.activeWidgets.length).toEqual(2);
    expect(component.activeTab).toEqual(tabData[0].id);

    // Select second tab
    component.selectTab(tabData[1].id);
    expect(component.activeTab).toEqual(tabData[1].id);
    const getSecondTabWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab}`
    );
    getSecondTabWidgetsRequest.flush([]);
  });

  it("Should display two tabs then delete a widget and the second tab", () => {
    const request = httpTestingController.expectOne(environment.backend_url + tabPath);
    request.flush(tabData);
    expect(component.tabs).toEqual(tabData);
    const getWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab}`
    );
    getWidgetsRequest.flush(firstTabWidgetData);
    expect(component.tabs.length).toEqual(2);
    expect(component.activeWidgets.length).toEqual(2);

    // Delete second widget
    const widgetIdToDelete = component.activeWidgets[1].id;
    component.deleteWidgetFromDashboard(widgetIdToDelete);
    const deleteWidgetRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/deleteWidget?id=${widgetIdToDelete}`
    );
    deleteWidgetRequest.flush(null, { status: 200, statusText: "OK" });
    expect(component.activeWidgets.length).toEqual(1);

    // Delete second tab
    const tabIdToDelete = component.tabs[1].id;
    component.deleteTabFromDash(tabIdToDelete);
    const deleteTabRequest = httpTestingController.expectOne(
      `${environment.backend_url}/tab/deleteTab?id=${tabIdToDelete}`
    );
    deleteTabRequest.flush(null, { status: 200, statusText: "OK" });
    expect(component.tabs.length).toEqual(1);
  });

  it("Should delete the last tab and select the first after", () => {
    const tabsFromDatabase = [
      { id: 1, label: "Home", tabOrder: 1 },
      { id: 2, label: "RSS", tabOrder: 2 },
      { id: 3, label: "Weather", tabOrder: 3 }
    ];

    const getTabsRequest = httpTestingController.expectOne(environment.backend_url + "/tab/");
    getTabsRequest.flush(tabsFromDatabase);

    const getWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab}`
    );
    getWidgetsRequest.flush([]);
    expect(component.activeTab).toEqual(tabsFromDatabase[0].id);
  });

  it("Should delete the first tab and select the second after", () => {
    const tabsFromDatabase = [
      { id: 1, label: "Home", tabOrder: 1 },
      { id: 2, label: "RSS", tabOrder: 2 },
      { id: 3, label: "Weather", tabOrder: 3 }
    ];

    const getTabsRequest = httpTestingController.expectOne(environment.backend_url + "/tab/");
    getTabsRequest.flush(tabsFromDatabase);

    const getWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab}`
    );
    getWidgetsRequest.flush([]);

    const tabIdToDelete = component.tabs[0].id;
    component.deleteTabFromDash(tabIdToDelete);
    const deleteTabRequest = httpTestingController.expectOne(
      `${environment.backend_url}/tab/deleteTab?id=${tabIdToDelete}`
    );
    deleteTabRequest.flush(null);

    const getTabWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab}`
    );
    getTabWidgetsRequest.flush([]);

    expect(component.activeTab).toEqual(component.tabs[0].id);
  });

  it("Should delete the active tab and select the first one after", () => {
    const tabsFromDatabase = [
      { id: 1, label: "Home", tabOrder: 1 },
      { id: 2, label: "RSS", tabOrder: 2 },
      { id: 3, label: "Weather", tabOrder: 3 }
    ];

    const getTabsRequest = httpTestingController.expectOne(environment.backend_url + "/tab/");
    getTabsRequest.flush(tabsFromDatabase);

    const getWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab}`
    );
    getWidgetsRequest.flush([]);

    component.selectTab(component.tabs[1].id);

    const getSecondTabWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.tabs[1].id}`
    );
    getSecondTabWidgetsRequest.flush([]);

    const tabIdToDelete = component.activeTab;

    component.deleteTabFromDash(tabIdToDelete);
    const deleteTabRequest = httpTestingController.expectOne(
      `${environment.backend_url}/tab/deleteTab?id=${tabIdToDelete}`
    );
    deleteTabRequest.flush(null);

    const getTabWidgetRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab}`
    );
    getTabWidgetRequest.flush([]);
    expect(component.activeTab).toEqual(tabsFromDatabase[0].id);
  });

  it("Should delete a tab", () => {
    const tabsFromDatabase = [{ id: 1, label: "Home", tabOrder: 1 }];

    const getTabsRequest = httpTestingController.expectOne(environment.backend_url + "/tab/");
    getTabsRequest.flush(tabsFromDatabase);

    const getWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab}`
    );
    getWidgetsRequest.flush([]);

    const lastTabToDelete = component.activeTab;
    component.deleteTabFromDash(lastTabToDelete);
    const deleteLastTabRequest = httpTestingController.expectOne(
      `${environment.backend_url}/tab/deleteTab?id=${lastTabToDelete}`
    );
    deleteLastTabRequest.flush(null);
  });

  it("Should switch between light and dark mode", () => {
    const getTabsRequest = httpTestingController.expectOne(environment.backend_url + "/tab/");
    getTabsRequest.flush([]);
    component.toggleTheme(true);
    expect(localStorage.getItem("preferredTheme")).toEqual("dark");
    component.toggleTheme(true);
    expect(localStorage.getItem("preferredTheme")).toEqual("dark");
    component.toggleTheme(false);
    expect(localStorage.getItem("preferredTheme")).toEqual("light");
  });
});

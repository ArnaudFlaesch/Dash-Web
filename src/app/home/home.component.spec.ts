import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";

import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { environment } from "../../environments/environment";
import { WidgetTypeEnum } from "../enums/WidgetTypeEnum";
import { IWidgetConfig } from "../model/IWidgetConfig";
import { AuthService } from "../services/auth.service/auth.service";
import { ConfigService } from "../services/config.service/config.service";
import { ErrorHandlerService } from "../services/error.handler.service";
import { TabService } from "../services/tab.service/tab.service";
import { ThemeService } from "../services/theme.service/theme.service";
import { WidgetService } from "../services/widget.service/widget.service";
import { HomeComponent } from "./home.component";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { Observable, of } from "rxjs";
import { vi } from "vitest";
import { ITab } from "../model/Tab";

describe("HomeComponent", () => {
  let component: HomeComponent;
  let httpTestingController: HttpTestingController;
  let dialogResult: string | undefined;

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
    dialogResult = undefined;
    await TestBed.configureTestingModule({
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
        ThemeService,
        {
          provide: MatDialog,
          useValue: {
            open: (): { afterClosed: () => Observable<string | undefined> } => ({
              afterClosed: (): Observable<string | undefined> => of(dialogResult)
            })
          }
        }
      ]
    })
      // Not rendered, so that the resources are only loaded by the test, not by the child components
      .overrideTemplate(HomeComponent, "")
      .compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    TestBed.tick();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  /** Lets the resources receive the flushed responses, then load the requests depending on them. */
  async function flushResources(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  it("Should display two tabs with two widgets on the first one", async () => {
    expect(component.tabs()).toEqual([]);
    const request = httpTestingController.expectOne(environment.backend_url + tabPath);
    request.flush(tabData);
    await flushResources();
    expect(component.tabs()).toEqual(tabData);
    const getWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab()}`
    );
    getWidgetsRequest.flush(firstTabWidgetData);
    await flushResources();
    expect(component.tabs().length).toEqual(2);
    expect(component.activeWidgets().length).toEqual(2);
    expect(component.activeTab()).toEqual(tabData[0].id);

    // Select second tab
    component.selectTab(tabData[1].id);
    TestBed.tick();
    expect(component.activeTab()).toEqual(tabData[1].id);
    const getSecondTabWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab()}`
    );
    getSecondTabWidgetsRequest.flush([]);
    await flushResources();
  });

  it("Should display two tabs then delete a widget and the second tab", async () => {
    const request = httpTestingController.expectOne(environment.backend_url + tabPath);
    request.flush(tabData);
    await flushResources();
    expect(component.tabs()).toEqual(tabData);
    const getWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab()}`
    );
    getWidgetsRequest.flush(firstTabWidgetData);
    await flushResources();
    expect(component.tabs().length).toEqual(2);
    expect(component.activeWidgets().length).toEqual(2);

    // Delete second widget
    const widgetIdToDelete = component.activeWidgets()[1].id;
    component.deleteWidgetFromDashboard(widgetIdToDelete);
    const deleteWidgetRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/deleteWidget?id=${widgetIdToDelete}`
    );
    deleteWidgetRequest.flush(null, { status: 200, statusText: "OK" });
    expect(component.activeWidgets().length).toEqual(1);

    // Delete second tab
    const tabIdToDelete = component.tabs()[1].id;
    component.deleteTabFromDash(tabIdToDelete);
    const deleteTabRequest = httpTestingController.expectOne(
      `${environment.backend_url}/tab/deleteTab?id=${tabIdToDelete}`
    );
    deleteTabRequest.flush(null, { status: 200, statusText: "OK" });
    expect(component.tabs().length).toEqual(1);
  });

  it("Should delete the last tab and select the first after", async () => {
    const tabsFromDatabase = [
      { id: 1, label: "Home", tabOrder: 1 },
      { id: 2, label: "RSS", tabOrder: 2 },
      { id: 3, label: "Weather", tabOrder: 3 }
    ];

    const getTabsRequest = httpTestingController.expectOne(environment.backend_url + "/tab/");
    getTabsRequest.flush(tabsFromDatabase);
    await flushResources();

    const getWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab()}`
    );
    getWidgetsRequest.flush([]);
    await flushResources();
    expect(component.activeTab()).toEqual(tabsFromDatabase[0].id);
  });

  it("Should delete the first tab and select the second after", async () => {
    const tabsFromDatabase = [
      { id: 1, label: "Home", tabOrder: 1 },
      { id: 2, label: "RSS", tabOrder: 2 },
      { id: 3, label: "Weather", tabOrder: 3 }
    ];

    const getTabsRequest = httpTestingController.expectOne(environment.backend_url + "/tab/");
    getTabsRequest.flush(tabsFromDatabase);
    await flushResources();

    const getWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab()}`
    );
    getWidgetsRequest.flush([]);
    await flushResources();

    const tabIdToDelete = component.tabs()[0].id;
    component.deleteTabFromDash(tabIdToDelete);
    const deleteTabRequest = httpTestingController.expectOne(
      `${environment.backend_url}/tab/deleteTab?id=${tabIdToDelete}`
    );
    deleteTabRequest.flush(null);

    TestBed.tick();
    const getTabWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab()}`
    );
    getTabWidgetsRequest.flush([]);
    await flushResources();

    expect(component.activeTab()).toEqual(component.tabs()[0].id);
  });

  it("Should delete the active tab and select the first one after", async () => {
    const tabsFromDatabase = [
      { id: 1, label: "Home", tabOrder: 1 },
      { id: 2, label: "RSS", tabOrder: 2 },
      { id: 3, label: "Weather", tabOrder: 3 }
    ];

    const getTabsRequest = httpTestingController.expectOne(environment.backend_url + "/tab/");
    getTabsRequest.flush(tabsFromDatabase);
    await flushResources();

    const getWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab()}`
    );
    getWidgetsRequest.flush([]);
    await flushResources();

    component.selectTab(component.tabs()[1].id);
    TestBed.tick();

    const getSecondTabWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.tabs()[1].id}`
    );
    getSecondTabWidgetsRequest.flush([]);
    await flushResources();

    const tabIdToDelete = component.activeTab();

    component.deleteTabFromDash(tabIdToDelete);
    const deleteTabRequest = httpTestingController.expectOne(
      `${environment.backend_url}/tab/deleteTab?id=${tabIdToDelete}`
    );
    deleteTabRequest.flush(null);

    TestBed.tick();
    const getTabWidgetRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab()}`
    );
    getTabWidgetRequest.flush([]);
    await flushResources();
    expect(component.activeTab()).toEqual(tabsFromDatabase[0].id);
  });

  it("Should delete a tab", async () => {
    const tabsFromDatabase = [{ id: 1, label: "Home", tabOrder: 1 }];

    const getTabsRequest = httpTestingController.expectOne(environment.backend_url + "/tab/");
    getTabsRequest.flush(tabsFromDatabase);
    await flushResources();

    const getWidgetsRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/?tabId=${component.activeTab()}`
    );
    getWidgetsRequest.flush([]);
    await flushResources();

    const lastTabToDelete = component.activeTab();
    component.deleteTabFromDash(lastTabToDelete);
    const deleteLastTabRequest = httpTestingController.expectOne(
      `${environment.backend_url}/tab/deleteTab?id=${lastTabToDelete}`
    );
    deleteLastTabRequest.flush(null);
  });

  it("Should switch between light and dark mode", async () => {
    const getTabsRequest = httpTestingController.expectOne(environment.backend_url + "/tab/");
    getTabsRequest.flush([]);
    await flushResources();
    component.toggleTheme(true);
    expect(localStorage.getItem("preferredTheme")).toEqual("dark");
    component.toggleTheme(true);
    expect(localStorage.getItem("preferredTheme")).toEqual("dark");
    component.toggleTheme(false);
    expect(localStorage.getItem("preferredTheme")).toEqual("light");
  });

  async function loadDashboard(widgets: IWidgetConfig[] = firstTabWidgetData): Promise<void> {
    httpTestingController.expectOne(environment.backend_url + tabPath).flush(tabData);
    await flushResources();
    httpTestingController
      .expectOne(`${environment.backend_url}/widget/?tabId=${tabData[0].id}`)
      .flush(widgets);
    await flushResources();
  }

  it("Should add a new tab and select it", async () => {
    await loadDashboard();
    component.addNewTab();
    const request = httpTestingController.expectOne(`${environment.backend_url}/tab/addTab`);
    expect(request.request.body).toEqual({ label: "Nouvel onglet" });
    request.flush({ id: 3, label: "Nouvel onglet", tabOrder: 3 });
    TestBed.tick();
    httpTestingController.expectOne(`${environment.backend_url}/widget/?tabId=3`).flush([]);
    await flushResources();

    expect(component.tabs().length).toEqual(3);
    expect(component.activeTab()).toEqual(3);
    expect(component.activeWidgets()).toEqual([]);
  });

  it("Should add the widget selected in the creation modal", async () => {
    await loadDashboard();
    dialogResult = "WEATHER";
    component.openCreateWidgetModal();
    const request = httpTestingController.expectOne(`${environment.backend_url}/widget/addWidget`);
    expect(request.request.body).toEqual({ type: WidgetTypeEnum.WEATHER, tabId: tabData[0].id });
    request.flush({ id: 3, type: WidgetTypeEnum.WEATHER, tabId: 1, widgetOrder: 3 });
    expect(component.activeWidgets().length).toEqual(3);
  });

  it("Should not add a widget when the creation modal is closed", async () => {
    await loadDashboard();
    component.openCreateWidgetModal();
    httpTestingController.expectNone(`${environment.backend_url}/widget/addWidget`);
    expect(component.activeWidgets().length).toEqual(2);
  });

  it("Should reorder the tabs", async () => {
    await loadDashboard();
    component.drop({ previousIndex: 0, currentIndex: 1 } as CdkDragDrop<ITab[]>);
    const request = httpTestingController.expectOne(`${environment.backend_url}/tab/updateTabs`);
    expect(request.request.body).toEqual([
      { ...tabData[1], tabOrder: 0 },
      { ...tabData[0], tabOrder: 1 }
    ]);
    request.flush(request.request.body);
    expect(component.tabs().map((tab) => tab.id)).toEqual([2, 1]);
  });

  it("Should save the widgets order", async () => {
    await loadDashboard();
    component.updateWidgetOrder(firstTabWidgetData);
    httpTestingController
      .expectOne(`${environment.backend_url}/widget/updateWidgetsOrder`)
      .flush(firstTabWidgetData);
  });

  it("Should delete a widget when its deletion is requested", async () => {
    await loadDashboard();
    TestBed.inject(WidgetService).notifyWidgetDeleted(firstTabWidgetData[0].id);
    httpTestingController
      .expectOne(`${environment.backend_url}/widget/deleteWidget?id=${firstTabWidgetData[0].id}`)
      .flush(null);
    expect(component.activeWidgets().map((widget) => widget.id)).toEqual([2]);
  });

  it("Should refresh all the widgets and toggle the edit mode", async () => {
    await loadDashboard();
    const refreshSpy = vi.fn();
    TestBed.inject(WidgetService).refreshWidgetsAction.subscribe(refreshSpy);
    component.refreshAllWidgets();
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    expect(component.editModeEnabled()).toBe(false);
    component.toggleEditMode();
    expect(component.editModeEnabled()).toBe(true);
  });

  it("Should export the configuration", async () => {
    await loadDashboard();
    const createObjectURL = vi.fn(() => "blob:config");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL }));
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    component.downloadConfig();
    httpTestingController
      .expectOne(`${environment.backend_url}/dashConfig/export`)
      .flush(new Blob(["{}"]));

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:config");
    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("Should display errors when the dashboard actions fail", async () => {
    const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
    httpTestingController
      .expectOne(environment.backend_url + tabPath)
      .flush(null, { status: 500, statusText: "Server error" });
    await flushResources();
    expect(component.isDashboardLoaded()).toBe(true);

    component.addNewTab();
    httpTestingController
      .expectOne(`${environment.backend_url}/tab/addTab`)
      .flush(null, { status: 500, statusText: "Server error" });

    component.downloadConfig();
    httpTestingController
      .expectOne(`${environment.backend_url}/dashConfig/export`)
      .flush(null, { status: 500, statusText: "Server error" });

    expect(handleErrorSpy).toHaveBeenCalledTimes(3);
  });

  it("Should log out the user", async () => {
    await loadDashboard();
    localStorage.setItem("user", JSON.stringify({ accessToken: "token" }));
    const navigateSpy = vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);
    await component.logout();
    expect(localStorage.getItem("user")).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(["login"]);
  });
});

import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";

import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { environment } from "../../environments/environment";
import { WidgetTypeEnum } from "../enums/WidgetTypeEnum";
import { IWidgetConfig } from "../model/IWidgetConfig";
import { AuthService } from "../services/auth.service";
import { ConfigService } from "../services/config.service";
import { ErrorHandlerService } from "../services/error-handler.service";
import { TabService } from "../services/tab.service";
import { ThemeService } from "../services/theme.service";
import { WidgetService } from "../services/widget.service";
import { HomeComponent } from "./home.component";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { NEVER, Observable, of } from "rxjs";
import { vi } from "vitest";
import { ITab } from "../model/ITab";
import { ImportConfigModalComponent } from "../modals/import-config-modal/import-config-modal.component";
import { ComponentFixture } from "@angular/core/testing";
import { RoleEnum } from "../model/RoleEnum";
import { MiniWidgetService } from "../services/mini-widget.service";
import { NotificationService } from "../services/notification.service";
import { WidgetListComponent } from "../widgets/widget-list/widget-list.component";

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

  const threeTabs = [
    { id: 1, label: "Home", tabOrder: 1 },
    { id: 2, label: "RSS", tabOrder: 2 },
    { id: 3, label: "Weather", tabOrder: 3 }
  ];

  /** Lets the resources receive the flushed responses, then load the requests depending on them. */
  async function flushResources(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  /** Answers the request loading the widgets of the active tab. */
  async function flushActiveTabWidgets(widgets: IWidgetConfig[] = []): Promise<void> {
    httpTestingController
      .expectOne(`${environment.backend_url}/widget/?tabId=${component.activeTab()}`)
      .flush(widgets);
    await flushResources();
  }

  /** Loads the tabs, then the widgets of the first tab. */
  async function loadDashboard(
    tabs: ITab[] = tabData,
    widgets: IWidgetConfig[] = firstTabWidgetData
  ): Promise<void> {
    httpTestingController.expectOne(environment.backend_url + tabPath).flush(tabs);
    await flushResources();
    await flushActiveTabWidgets(widgets);
  }

  function deleteTab(tabId: number): void {
    component.deleteTabFromDash(tabId);
    httpTestingController
      .expectOne(`${environment.backend_url}/tab/deleteTab?id=${tabId}`)
      .flush(null, { status: 200, statusText: "OK" });
  }

  it("Should display two tabs with two widgets on the first one", async () => {
    expect(component.tabs()).toEqual([]);
    await loadDashboard();
    expect(component.tabs()).toEqual(tabData);
    expect(component.activeWidgets()).toHaveLength(2);
    expect(component.activeTab()).toEqual(tabData[0].id);

    // Select second tab
    component.selectTab(tabData[1].id);
    TestBed.tick();
    expect(component.activeTab()).toEqual(tabData[1].id);
    await flushActiveTabWidgets();
  });

  it("Should display two tabs then delete a widget and the second tab", async () => {
    await loadDashboard();

    // Delete second widget
    const widgetIdToDelete = component.activeWidgets()[1].id;
    component.deleteWidgetFromDashboard(widgetIdToDelete);
    const deleteWidgetRequest = httpTestingController.expectOne(
      `${environment.backend_url}/widget/deleteWidget?id=${widgetIdToDelete}`
    );
    deleteWidgetRequest.flush(null, { status: 200, statusText: "OK" });
    expect(component.activeWidgets()).toHaveLength(1);

    // Delete second tab
    deleteTab(component.tabs()[1].id);
    expect(component.tabs()).toHaveLength(1);
  });

  it("Should delete the last tab and select the first after", async () => {
    await loadDashboard(threeTabs, []);
    expect(component.activeTab()).toEqual(threeTabs[0].id);
  });

  it("Should delete the first tab and select the second after", async () => {
    await loadDashboard(threeTabs, []);

    deleteTab(component.tabs()[0].id);
    TestBed.tick();
    await flushActiveTabWidgets();

    expect(component.activeTab()).toEqual(component.tabs()[0].id);
  });

  it("Should delete the active tab and select the first one after", async () => {
    await loadDashboard(threeTabs, []);

    component.selectTab(component.tabs()[1].id);
    TestBed.tick();
    await flushActiveTabWidgets();

    deleteTab(component.activeTab());
    TestBed.tick();
    await flushActiveTabWidgets();
    expect(component.activeTab()).toEqual(threeTabs[0].id);
  });

  it("Should delete a tab", async () => {
    await loadDashboard([{ id: 1, label: "Home", tabOrder: 1 }], []);

    deleteTab(component.activeTab());
    expect(component.tabs()).toEqual([]);
    expect(component.activeWidgets()).toEqual([]);
  });

  it("Should switch between light and dark mode", async () => {
    httpTestingController.expectOne(environment.backend_url + tabPath).flush([]);
    await flushResources();
    component.toggleTheme(true);
    expect(localStorage.getItem("preferredTheme")).toEqual("dark");
    component.toggleTheme(true);
    expect(localStorage.getItem("preferredTheme")).toEqual("dark");
    component.toggleTheme(false);
    expect(localStorage.getItem("preferredTheme")).toEqual("light");
  });

  it("Should add a new tab and select it", async () => {
    await loadDashboard();
    component.addNewTab();
    const request = httpTestingController.expectOne(`${environment.backend_url}/tab/addTab`);
    expect(request.request.body).toEqual({ label: "Nouvel onglet" });
    request.flush({ id: 3, label: "Nouvel onglet", tabOrder: 3 });
    TestBed.tick();
    await flushActiveTabWidgets();

    expect(component.tabs()).toHaveLength(3);
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
    expect(component.activeWidgets()).toHaveLength(3);
  });

  it("Should not add a widget when the creation modal is closed", async () => {
    await loadDashboard();
    component.openCreateWidgetModal();
    httpTestingController.expectNone(`${environment.backend_url}/widget/addWidget`);
    expect(component.activeWidgets()).toHaveLength(2);
  });

  it("Should open the configuration import modal", async () => {
    await loadDashboard();
    const openSpy = vi.spyOn(TestBed.inject(MatDialog), "open");
    component.openImportConfigModal();
    expect(openSpy).toHaveBeenCalledWith(ImportConfigModalComponent, { width: "640px" });
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
    const request = httpTestingController.expectOne(
      `${environment.backend_url}/widget/updateWidgetsOrder`
    );
    expect(request.request.body).toEqual(firstTabWidgetData);
    request.flush(firstTabWidgetData);
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
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

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

  it("Should display errors when the widget and tab actions fail", async () => {
    const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
    const serverError = { status: 500, statusText: "Server error" };
    httpTestingController.expectOne(environment.backend_url + tabPath).flush(tabData);
    await flushResources();
    httpTestingController
      .expectOne(`${environment.backend_url}/widget/?tabId=1`)
      .flush(null, serverError);
    await flushResources();
    expect(component.activeWidgets()).toEqual([]);
    expect(handleErrorSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la récupération des widgets."
    );

    component.deleteWidgetFromDashboard(1);
    httpTestingController
      .expectOne(`${environment.backend_url}/widget/deleteWidget?id=1`)
      .flush(null, serverError);
    expect(handleErrorSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      "Erreur lors de la suppression d'un widget."
    );

    component.deleteTabFromDash(1);
    httpTestingController
      .expectOne(`${environment.backend_url}/tab/deleteTab?id=1`)
      .flush(null, serverError);
    expect(component.tabs()).toEqual(tabData);
    expect(handleErrorSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      "Erreur lors de la suppression d'un onglet."
    );

    component.updateWidgetOrder(firstTabWidgetData);
    httpTestingController
      .expectOne(`${environment.backend_url}/widget/updateWidgetsOrder`)
      .flush(null, serverError);
    expect(handleErrorSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      "Erreur lors de la mise à jour des widgets."
    );

    component.drop({ previousIndex: 0, currentIndex: 1 } as CdkDragDrop<ITab[]>);
    httpTestingController
      .expectOne(`${environment.backend_url}/tab/updateTabs`)
      .flush(null, serverError);
    expect(component.tabs()).toEqual(tabData);
    expect(handleErrorSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      "Erreur lors de la mise à jour des onglets."
    );

    dialogResult = "RSS";
    component.openCreateWidgetModal();
    httpTestingController
      .expectOne(`${environment.backend_url}/widget/addWidget`)
      .flush(null, serverError);
    expect(handleErrorSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      "Erreur lors de l'ajout d'un widget."
    );
    expect(handleErrorSpy).toHaveBeenCalledTimes(6);
  });

  it("Should keep the renamed tab in the list of tabs", async () => {
    await loadDashboard();
    component.updateTab({ ...tabData[1], label: "Journaux" });
    expect(component.tabs()).toEqual([tabData[0], { ...tabData[1], label: "Journaux" }]);
    expect(component.activeTab()).toEqual(tabData[0].id);
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

describe("HomeComponent template", () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let httpTestingController: HttpTestingController;
  let dialogResult: string | undefined;

  const tabs: ITab[] = [
    { id: 1, label: "Flux RSS", tabOrder: 1 },
    { id: 2, label: "Météo", tabOrder: 2 }
  ];

  const widgets = [
    { id: 1, type: WidgetTypeEnum.RSS, data: { url: "url.rss.xml" }, tabId: 1, widgetOrder: 1 }
  ] as IWidgetConfig[];

  beforeEach(async () => {
    dialogResult = undefined;
    localStorage.removeItem("user");
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: "home", component: HomeComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: MatDialog,
          useValue: {
            open: (): { afterClosed: () => Observable<string | undefined> } => ({
              afterClosed: (): Observable<string | undefined> => of(dialogResult)
            })
          }
        },
        // The child components load their own resources, which are not tested here
        {
          provide: MiniWidgetService,
          useValue: { getMiniWidgets: () => of([]), miniWidgetDeleted: NEVER }
        },
        {
          provide: NotificationService,
          useValue: { getNotifications: () => of({ content: [] }) }
        }
      ]
    })
      // Not rendered, so that the widgets don't load their data
      .overrideTemplate(WidgetListComponent, "")
      .compileComponents();
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.removeItem("user");
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    TestBed.tick();
  }

  function getElement<T extends HTMLElement>(selector: string): T {
    return (fixture.nativeElement as HTMLElement).querySelector(selector) as T;
  }

  function getTabs(): HTMLElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("dash-tab"));
  }

  function getWidgetList(): WidgetListComponent {
    return fixture.debugElement.query((debugElement) => debugElement.name === "dash-widget-list")
      .componentInstance as WidgetListComponent;
  }

  /**
   * Lets the resources receive the flushed responses, then renders the component.
   * `whenStable` can't be used here as it waits for the requests sent by the resources.
   */
  async function render(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  async function flushWidgets(tabId: number, widgetsOfTab: IWidgetConfig[]): Promise<void> {
    httpTestingController
      .expectOne(`${environment.backend_url}/widget/?tabId=${tabId}`)
      .flush(widgetsOfTab);
    await render();
  }

  /** Loads the tabs, then the widgets of the first tab. */
  async function loadDashboard(
    tabsToLoad: ITab[] = tabs,
    widgetsOfTab: IWidgetConfig[] = widgets
  ): Promise<void> {
    createComponent();
    httpTestingController.expectOne(`${environment.backend_url}/tab/`).flush(tabsToLoad);
    await render();
    if (tabsToLoad.length > 0) {
      expect(getElement("#widgets-loading-spinner")).not.toBeNull();
      await flushWidgets(tabsToLoad[0].id, widgetsOfTab);
    }
  }

  it("Should display a spinner while the tabs are loading", async () => {
    createComponent();
    expect(getElement("#dashboard-loading-spinner")).not.toBeNull();
    expect(getElement("#home-header-container")).toBeNull();
    httpTestingController.expectOne(`${environment.backend_url}/tab/`).flush([]);
    await render();
    expect(getElement("#dashboard-loading-spinner")).toBeNull();
    expect(getElement("#brand-name").textContent?.trim()).toEqual(component.labels.brandName);
  });

  it("Should display the tabs and the widgets of the first tab", async () => {
    await loadDashboard();
    expect(getElement("#widgets-loading-spinner")).toBeNull();
    expect(getTabs().map((tab) => tab.textContent?.trim())).toEqual(tabs.map((tab) => tab.label));
    expect(getTabs()[0].classList).toContain("selected-item");
    expect(getTabs()[0].getAttribute("aria-current")).toEqual("page");
    expect(getTabs()[1].classList).not.toContain("selected-item");
    expect(getElement("#tab-list-container").getAttribute("aria-label")).toEqual(
      component.labels.tabs
    );
    expect(getElement("#add-widget-button-label").textContent?.trim()).toEqual(
      component.labels.widget
    );
    expect(getElement<HTMLButtonElement>("#open-add-widget-modal").disabled).toBe(false);
    expect(getElement("dash-miniwidget-list")).not.toBeNull();
    expect(getElement("#no-tab-message")).toBeNull();
    expect(getElement("#empty-tab-message")).toBeNull();
    expect(getWidgetList().widgetList()).toEqual(widgets);
    expect(getWidgetList().toggleEditMode()).toBe(false);
  });

  it("Should load the widgets of the tab clicked", async () => {
    await loadDashboard();
    getTabs()[1].click();
    TestBed.tick();
    expect(getElement("#widgets-loading-spinner")).not.toBeNull();
    await flushWidgets(tabs[1].id, []);
    expect(component.activeTab()).toEqual(tabs[1].id);
    expect(getTabs()[1].classList).toContain("selected-item");
    expect(getTabs()[0].classList).not.toContain("selected-item");
  });

  it("Should select the tab of the url", async () => {
    await TestBed.inject(Router).navigateByUrl("/home?tabId=2");
    createComponent();
    httpTestingController.expectOne(`${environment.backend_url}/tab/`).flush(tabs);
    await render();
    await flushWidgets(2, []);
    expect(component.activeTab()).toEqual(2);
    expect(getTabs()[1].classList).toContain("selected-item");
  });

  it("Should select the first tab when the tab of the url does not exist", async () => {
    await TestBed.inject(Router).navigateByUrl("/home?tabId=42");
    await loadDashboard();
    expect(component.activeTab()).toEqual(tabs[0].id);
  });

  it("Should invite to create a tab when there is none", async () => {
    await loadDashboard([], []);
    expect(getElement("#no-tab-message h2").textContent?.trim()).toEqual(component.labels.noTab);
    expect(getElement("#no-tab-message p").textContent?.trim()).toEqual(component.labels.noTabHint);
    expect(getElement<HTMLButtonElement>("#open-add-widget-modal").disabled).toBe(true);

    const createTabButton = getElement<HTMLButtonElement>("#no-tab-message button");
    expect(createTabButton.textContent).toContain(component.labels.createTab);
    createTabButton.click();
    httpTestingController
      .expectOne(`${environment.backend_url}/tab/addTab`)
      .flush({ id: 3, label: "Nouvel onglet", tabOrder: 1 });
    TestBed.tick();
    await flushWidgets(3, []);
    expect(getTabs()).toHaveLength(1);
    expect(getElement("#no-tab-message")).toBeNull();
    expect(getElement("#empty-tab-message")).not.toBeNull();
  });

  it("Should invite to add a widget when the tab is empty", async () => {
    await loadDashboard(tabs, []);
    expect(getElement("#empty-tab-message h2").textContent?.trim()).toEqual(
      component.labels.emptyTab
    );
    expect(getElement("#empty-tab-message p").textContent?.trim()).toEqual(
      component.labels.emptyTabHint
    );
    const addWidgetButton = getElement<HTMLButtonElement>("#empty-tab-message button");
    expect(addWidgetButton.textContent).toContain(component.labels.addWidget);

    dialogResult = "WEATHER";
    addWidgetButton.click();
    const request = httpTestingController.expectOne(`${environment.backend_url}/widget/addWidget`);
    expect(request.request.body).toEqual({ type: WidgetTypeEnum.WEATHER, tabId: tabs[0].id });
    request.flush({ id: 4, type: WidgetTypeEnum.WEATHER, tabId: 1, widgetOrder: 1 });
    await fixture.whenStable();
    expect(getElement("#empty-tab-message")).toBeNull();
    expect(getElement("dash-widget-list")).not.toBeNull();
  });

  it("Should add a tab from the header and select it", async () => {
    await loadDashboard();
    getElement<HTMLButtonElement>("#add-new-tab-button").click();
    httpTestingController
      .expectOne(`${environment.backend_url}/tab/addTab`)
      .flush({ id: 3, label: "Nouvel onglet", tabOrder: 3 });
    TestBed.tick();
    await flushWidgets(3, []);
    expect(getTabs()).toHaveLength(3);
    expect(getTabs()[2].classList).toContain("selected-item");
  });

  it("Should add a widget from the header", async () => {
    await loadDashboard();
    dialogResult = "RSS";
    getElement<HTMLButtonElement>("#open-add-widget-modal").click();
    httpTestingController
      .expectOne(`${environment.backend_url}/widget/addWidget`)
      .flush({ id: 2, type: WidgetTypeEnum.RSS, tabId: 1, widgetOrder: 2 });
    await fixture.whenStable();
    expect(getWidgetList().widgetList()).toHaveLength(2);
  });

  it("Should toggle the edit mode", async () => {
    await loadDashboard();
    expect(getElement("#edit-mode-banner")).toBeNull();
    expect(getElement("#validate-widget-list-button")).toBeNull();

    getElement<HTMLButtonElement>("#toggle-edit-mode-button").click();
    await fixture.whenStable();
    expect(getElement("#toggle-edit-mode-button")).toBeNull();
    expect(getElement("#edit-mode-banner span").textContent?.trim()).toEqual(
      component.labels.editModeHint
    );
    expect(getTabs()[0].classList).toContain("draggable");
    expect(getWidgetList().toggleEditMode()).toBe(true);

    getElement<HTMLButtonElement>("#validate-widget-list-button").click();
    await fixture.whenStable();
    expect(getElement("#edit-mode-banner")).toBeNull();

    getElement<HTMLButtonElement>("#toggle-edit-mode-button").click();
    await fixture.whenStable();
    const finishButton = getElement<HTMLButtonElement>("#edit-mode-banner button");
    expect(finishButton.textContent?.trim()).toEqual(component.labels.finish);
    finishButton.click();
    await fixture.whenStable();
    expect(getElement("#edit-mode-banner")).toBeNull();
    expect(component.editModeEnabled()).toBe(false);
  });

  it("Should refresh all the widgets", async () => {
    await loadDashboard();
    const refreshSpy = vi.fn();
    TestBed.inject(WidgetService).refreshWidgetsAction.subscribe(refreshSpy);
    getElement<HTMLButtonElement>("#reload-all-widgets-button").click();
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it("Should save the widgets order sent by the widget list", async () => {
    await loadDashboard();
    getWidgetList().updateWidgetsOrderEvent.emit(widgets);
    const request = httpTestingController.expectOne(
      `${environment.backend_url}/widget/updateWidgetsOrder`
    );
    expect(request.request.body).toEqual(widgets);
    request.flush(widgets);
  });

  it("Should not display the notifications to a user", async () => {
    await loadDashboard();
    expect(getElement("dash-notifications")).toBeNull();
  });

  it("Should display the notifications to an admin", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ id: 1, accessToken: "token", roles: [RoleEnum.ROLE_ADMIN] })
    );
    await loadDashboard();
    expect(getElement("dash-notifications")).not.toBeNull();
  });

  it("Should log out from the user menu", async () => {
    await loadDashboard();
    const navigateSpy = vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);
    getElement<HTMLButtonElement>("#dash-menu").click();
    await fixture.whenStable();
    const logoutButton = document.querySelector<HTMLButtonElement>("#logout-button");
    expect(logoutButton?.textContent).toContain(component.labels.logout);
    expect(document.querySelector("#download-config-button")?.textContent).toContain(
      component.labels.downloadConfig
    );
    expect(document.querySelector("#open-import-config-modal")?.textContent).toContain(
      component.labels.importConfig
    );
    logoutButton?.click();
    await vi.waitFor(() => expect(navigateSpy).toHaveBeenCalledWith(["login"]));
  });

  it("Should keep the new name of a tab when the tabs are reordered", async () => {
    await loadDashboard();
    getTabs()[0].querySelector(".tab-label")?.dispatchEvent(new MouseEvent("dblclick"));
    await fixture.whenStable();
    const input = getElement<HTMLInputElement>("#tab-name-input");
    input.value = "Journaux";
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();
    getElement(".save-tab-button").click();
    httpTestingController
      .expectOne(`${environment.backend_url}/tab/updateTab`)
      .flush({ id: 1, label: "Journaux", tabOrder: 1 });
    await fixture.whenStable();

    component.drop({ previousIndex: 0, currentIndex: 1 } as CdkDragDrop<ITab[]>);
    const request = httpTestingController.expectOne(`${environment.backend_url}/tab/updateTabs`);
    expect(request.request.body).toEqual([
      { id: 2, label: "Météo", tabOrder: 0 },
      { id: 1, label: "Journaux", tabOrder: 1 }
    ]);
    request.flush(request.request.body);
    await fixture.whenStable();
    expect(getTabs().map((tab) => tab.textContent?.trim())).toEqual(["Météo", "Journaux"]);
  });
});

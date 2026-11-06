import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";

import { provideHttpClient } from "@angular/common/http";
import { DebugElement } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { environment } from "@environments/environment";
import { WidgetType } from "@widgets/widget-type";
import { WidgetConfig } from "@widgets/widget-config";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { WidgetService } from "@widgets/widget-service";
import { Home } from "./home";
import { CdkDragDrop, CdkDropList } from "@angular/cdk/drag-drop";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Location } from "@angular/common";
import { By } from "@angular/platform-browser";
import { MatDialog } from "@angular/material/dialog";
import { MatSlideToggleHarness } from "@angular/material/slide-toggle/testing";
import { Router } from "@angular/router";
import { NEVER, Observable, of } from "rxjs";
import { vi } from "vitest";
import { Tab } from "@features/tab/tab";
import { ImportConfigModal } from "@features/home/import-config-modal/import-config-modal";
import { ComponentFixture } from "@angular/core/testing";
import { Role } from "@core/auth/role";
import { MiniWidgetService } from "@widgets/mini-widget-service";
import { NotificationService } from "@features/notifications/notification-service";
import { WidgetList } from "@widgets/widget-list/widget-list";

describe("Home", () => {
  let fixture: ComponentFixture<Home>;
  let httpTestingController: HttpTestingController;
  let dialogResult: string | undefined;

  const serverError = { status: 500, statusText: "Server error" };

  const tabs: Tab[] = [
    { id: 1, label: "Flux RSS", tabOrder: 1 },
    { id: 2, label: "Météo", tabOrder: 2 }
  ];

  const threeTabs: Tab[] = [
    { id: 1, label: "Home", tabOrder: 1 },
    { id: 2, label: "RSS", tabOrder: 2 },
    { id: 3, label: "Weather", tabOrder: 3 }
  ];

  const widgets = [
    { id: 1, type: WidgetType.RSS, data: { url: "url.rss.xml" }, tabId: 1, widgetOrder: 1 },
    { id: 2, type: WidgetType.RSS, data: { url: "url.rss.xml" }, tabId: 1, widgetOrder: 2 }
  ] as WidgetConfig[];

  beforeEach(async () => {
    dialogResult = undefined;
    localStorage.removeItem("user");
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: "home", component: Home }]),
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
      .overrideTemplate(WidgetList, "")
      .compileComponents();
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.removeItem("user");
    // The menus are rendered in an overlay attached to the body
    document.querySelector(".cdk-overlay-container")?.replaceChildren();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(Home);
    httpTestingController = TestBed.inject(HttpTestingController);
    TestBed.tick();
  }

  function getElement<T extends HTMLElement>(selector: string): T {
    return (fixture.nativeElement as HTMLElement).querySelector(selector) as T;
  }

  function getTabs(): HTMLElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("dash-tab-label"));
  }

  function getTabLabels(): (string | undefined)[] {
    return getTabs().map((tab) => tab.textContent?.trim());
  }

  /** Label of the selected tab, the one whose widgets are displayed. */
  function getSelectedTabLabel(): string | undefined {
    const selectedTabs = getTabs().filter((tab) => tab.classList.contains("selected-item"));
    expect(selectedTabs.length).toBeLessThanOrEqual(1);
    return selectedTabs[0]?.textContent?.trim();
  }

  function getTabLabelElement(tab: Tab): DebugElement {
    const tabLabel = fixture.debugElement
      .queryAll(By.css("dash-tab-label"))
      .find((debugElement) => debugElement.nativeElement.textContent.trim() === tab.label);
    if (!tabLabel) {
      throw new Error(`No tab ${tab.label}`);
    }
    return tabLabel;
  }

  function getWidgetList(): WidgetList {
    return fixture.debugElement.query((debugElement) => debugElement.name === "dash-widget-list")
      .componentInstance as WidgetList;
  }

  /**
   * Lets the resources receive the flushed responses, then renders the component.
   * `whenStable` can't be used here as it waits for the requests sent by the resources.
   */
  async function render(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  async function flushWidgets(tabId: number, widgetsOfTab: WidgetConfig[]): Promise<void> {
    httpTestingController
      .expectOne(`${environment.backend_url}/widget/?tabId=${tabId}`)
      .flush(widgetsOfTab);
    await render();
  }

  /** Loads the tabs, then the widgets of the first tab. */
  async function loadDashboard(
    tabsToLoad: Tab[] = tabs,
    widgetsOfTab: WidgetConfig[] = widgets
  ): Promise<void> {
    createComponent();
    httpTestingController.expectOne(`${environment.backend_url}/tab/`).flush(tabsToLoad);
    await render();
    if (tabsToLoad.length > 0) {
      expect(getElement("#widgets-loading-spinner")).not.toBeNull();
      await flushWidgets(tabsToLoad[0].id, widgetsOfTab);
    }
  }

  /** Clicks on a tab, then loads its widgets. */
  async function selectTab(tab: Tab, widgetsOfTab: WidgetConfig[] = []): Promise<void> {
    (getTabLabelElement(tab).nativeElement as HTMLElement).click();
    TestBed.tick();
    expect(getElement("#widgets-loading-spinner")).not.toBeNull();
    await flushWidgets(tab.id, widgetsOfTab);
  }

  /** Deletes a tab, as its label asks to with its delete button. */
  async function deleteTab(tab: Tab): Promise<void> {
    getTabLabelElement(tab).triggerEventHandler("tabDeletedEvent", tab.id);
    httpTestingController
      .expectOne(`${environment.backend_url}/tab/deleteTab?id=${tab.id}`)
      .flush(null, { status: 200, statusText: "OK" });
    await render();
  }

  /** Drops the first tab after the second one. */
  function dropFirstTabAfterSecond(): void {
    fixture.debugElement.query(By.css("#tab-list")).triggerEventHandler("cdkDropListDropped", {
      previousIndex: 0,
      currentIndex: 1
    } as CdkDragDrop<Tab[]>);
  }

  /** Opens the user menu, rendered in an overlay. */
  async function openUserMenu(): Promise<void> {
    getElement<HTMLButtonElement>("#dash-menu").click();
    await fixture.whenStable();
  }

  async function clickInUserMenu(selector: string): Promise<void> {
    await openUserMenu();
    document.querySelector<HTMLElement>(selector)?.click();
  }

  describe("Loading", () => {
    it("Should display a spinner while the tabs are loading", async () => {
      createComponent();
      expect(getElement("#dashboard-loading-spinner")).not.toBeNull();
      expect(getElement("#home-header-container")).toBeNull();
      httpTestingController.expectOne(`${environment.backend_url}/tab/`).flush([]);
      await render();
      expect(getElement("#dashboard-loading-spinner")).toBeNull();
      expect(getElement("#brand-name").textContent?.trim()).toEqual("Dash");
    });

    it("Should display the tabs and the widgets of the first tab", async () => {
      await loadDashboard();
      expect(getElement("#widgets-loading-spinner")).toBeNull();
      expect(getTabLabels()).toEqual(tabs.map((tab) => tab.label));
      expect(getSelectedTabLabel()).toEqual(tabs[0].label);
      expect(getTabs()[0].getAttribute("aria-current")).toEqual("page");
      expect(getTabs()[1].getAttribute("aria-current")).toBeNull();
      expect(getElement("#tab-list-container").getAttribute("aria-label")).toEqual("Onglets");
      expect(getElement("#add-widget-button-label").textContent?.trim()).toEqual("Widget");
      expect(getElement<HTMLButtonElement>("#open-add-widget-modal").disabled).toBe(false);
      expect(getElement("dash-mini-widget-list")).not.toBeNull();
      expect(getElement("#no-tab-message")).toBeNull();
      expect(getElement("#empty-tab-message")).toBeNull();
      expect(getWidgetList().widgetList()).toEqual(widgets);
      expect(getWidgetList().toggleEditMode()).toBe(false);
    });

    it("Should sort the tabs horizontally", async () => {
      await loadDashboard();
      const dropList = fixture.debugElement.query(By.css("#tab-list")).injector.get(CdkDropList);
      expect(dropList.orientation).toEqual("horizontal");
    });

    it("Should select the tab of the url", async () => {
      await TestBed.inject(Router).navigateByUrl("/home?tabId=2");
      createComponent();
      httpTestingController.expectOne(`${environment.backend_url}/tab/`).flush(tabs);
      await render();
      await flushWidgets(2, []);
      expect(getSelectedTabLabel()).toEqual(tabs[1].label);
    });

    it("Should select the first tab when the tab of the url does not exist", async () => {
      await TestBed.inject(Router).navigateByUrl("/home?tabId=42");
      await loadDashboard();
      expect(getSelectedTabLabel()).toEqual(tabs[0].label);
    });

    it("Should display the dashboard without tabs when they can't be loaded", async () => {
      const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
      createComponent();
      httpTestingController.expectOne(`${environment.backend_url}/tab/`).flush(null, serverError);
      await render();
      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: 500 }),
        "Erreur lors de l'initialisation du dashboard."
      );
      expect(getElement("#dashboard-loading-spinner")).toBeNull();
      expect(getTabs()).toEqual([]);
      expect(getElement("#no-tab-message")).not.toBeNull();
    });

    it("Should display an empty tab when its widgets can't be loaded", async () => {
      const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
      createComponent();
      httpTestingController.expectOne(`${environment.backend_url}/tab/`).flush(tabs);
      await render();
      httpTestingController
        .expectOne(`${environment.backend_url}/widget/?tabId=1`)
        .flush(null, serverError);
      await render();
      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: 500 }),
        "Erreur lors de la récupération des widgets."
      );
      expect(getElement("#empty-tab-message")).not.toBeNull();
      expect(getElement("dash-widget-list")).toBeNull();
    });
  });

  describe("Tabs", () => {
    it("Should load the widgets of the tab clicked", async () => {
      await loadDashboard();
      await selectTab(tabs[1]);
      expect(getSelectedTabLabel()).toEqual(tabs[1].label);
      expect(getTabs()[1].getAttribute("aria-current")).toEqual("page");
      expect(TestBed.inject(Location).path()).toContain("tabId=2");
      expect(getElement("#empty-tab-message")).not.toBeNull();
    });

    it("Should select a tab with the Enter key", async () => {
      await loadDashboard();
      getTabs()[1].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      TestBed.tick();
      await flushWidgets(tabs[1].id, []);
      expect(getSelectedTabLabel()).toEqual(tabs[1].label);
    });

    it("Should not reload the widgets when the selected tab is clicked", async () => {
      await loadDashboard();
      getTabs()[0].click();
      TestBed.tick();
      httpTestingController.expectNone(`${environment.backend_url}/widget/?tabId=1`);
      expect(TestBed.inject(Location).path()).not.toContain("tabId");
      expect(getWidgetList().widgetList()).toEqual(widgets);
    });

    it("Should invite to create a tab when there is none", async () => {
      await loadDashboard([], []);
      expect(getElement("#no-tab-message h2").textContent?.trim()).toEqual("Aucun onglet");
      expect(getElement("#no-tab-message p").textContent?.trim()).toEqual(
        "Créez un onglet pour commencer à composer votre dashboard."
      );
      expect(getElement<HTMLButtonElement>("#open-add-widget-modal").disabled).toBe(true);

      const createTabButton = getElement<HTMLButtonElement>("#no-tab-message button");
      expect(createTabButton.textContent).toContain("Créer un onglet");
      createTabButton.click();
      httpTestingController
        .expectOne(`${environment.backend_url}/tab/addTab`)
        .flush({ id: 3, label: "Nouvel onglet", tabOrder: 1 });
      TestBed.tick();
      await flushWidgets(3, []);
      expect(getTabLabels()).toEqual(["Nouvel onglet"]);
      expect(getElement("#no-tab-message")).toBeNull();
      expect(getElement("#empty-tab-message")).not.toBeNull();
    });

    it("Should add a tab from the header and select it", async () => {
      await loadDashboard();
      getElement<HTMLButtonElement>("#add-new-tab-button").click();
      const request = httpTestingController.expectOne(`${environment.backend_url}/tab/addTab`);
      expect(request.request.body).toEqual({ label: "Nouvel onglet" });
      request.flush({ id: 3, label: "Nouvel onglet", tabOrder: 3 });
      TestBed.tick();
      await flushWidgets(3, []);
      expect(getTabLabels()).toEqual([...tabs.map((tab) => tab.label), "Nouvel onglet"]);
      expect(getSelectedTabLabel()).toEqual("Nouvel onglet");
      expect(getElement("#empty-tab-message")).not.toBeNull();
    });

    it("Should delete a widget and the second tab", async () => {
      await loadDashboard();

      TestBed.inject(WidgetService).notifyWidgetDeleted(widgets[1].id);
      httpTestingController
        .expectOne(`${environment.backend_url}/widget/deleteWidget?id=${widgets[1].id}`)
        .flush(null, { status: 200, statusText: "OK" });
      await render();
      expect(getWidgetList().widgetList()).toEqual([widgets[0]]);

      await deleteTab(tabs[1]);
      expect(getTabLabels()).toEqual([tabs[0].label]);
      expect(getSelectedTabLabel()).toEqual(tabs[0].label);
      expect(getWidgetList().widgetList()).toEqual([widgets[0]]);
    });

    it("Should delete the last tab and keep the first one selected", async () => {
      await loadDashboard(threeTabs, []);
      await deleteTab(threeTabs[2]);
      expect(getTabLabels()).toEqual([threeTabs[0].label, threeTabs[1].label]);
      expect(getSelectedTabLabel()).toEqual(threeTabs[0].label);
    });

    it("Should delete the first tab and select the second after", async () => {
      await loadDashboard(threeTabs, widgets);

      await deleteTab(threeTabs[0]);
      // The widgets of the deleted tab are removed at once
      expect(getElement("dash-widget-list")).toBeNull();
      await flushWidgets(threeTabs[1].id, []);

      expect(getTabLabels()).toEqual([threeTabs[1].label, threeTabs[2].label]);
      expect(getSelectedTabLabel()).toEqual(threeTabs[1].label);
    });

    it("Should delete the active tab and select the first one after", async () => {
      await loadDashboard(threeTabs, []);
      await selectTab(threeTabs[1]);

      await deleteTab(threeTabs[1]);
      await flushWidgets(threeTabs[0].id, []);
      expect(getTabLabels()).toEqual([threeTabs[0].label, threeTabs[2].label]);
      expect(getSelectedTabLabel()).toEqual(threeTabs[0].label);
    });

    it("Should delete the only tab", async () => {
      await loadDashboard([{ id: 1, label: "Home", tabOrder: 1 }], widgets);

      await deleteTab({ id: 1, label: "Home", tabOrder: 1 });
      expect(getTabs()).toEqual([]);
      expect(getElement("dash-widget-list")).toBeNull();
      expect(getElement("#no-tab-message")).not.toBeNull();
    });

    it("Should reorder the tabs", async () => {
      await loadDashboard();
      dropFirstTabAfterSecond();
      const request = httpTestingController.expectOne(`${environment.backend_url}/tab/updateTabs`);
      expect(request.request.body).toEqual([
        { ...tabs[1], tabOrder: 0 },
        { ...tabs[0], tabOrder: 1 }
      ]);
      request.flush(request.request.body);
      await fixture.whenStable();
      expect(getTabLabels()).toEqual([tabs[1].label, tabs[0].label]);
    });

    it("Should keep the renamed tab in the list of tabs, without changing the selected tab", async () => {
      await loadDashboard();
      getTabs()[1].querySelector(".tab-label")?.dispatchEvent(new MouseEvent("dblclick"));
      await fixture.whenStable();
      const input = getElement<HTMLInputElement>("#tab-name-input");
      input.value = "Journaux";
      input.dispatchEvent(new Event("input"));
      await fixture.whenStable();
      // Clicking on the save button of a tab doesn't select it (no request for its widgets)
      getElement(".save-tab-button").click();
      httpTestingController
        .expectOne(`${environment.backend_url}/tab/updateTab`)
        .flush({ ...tabs[1], label: "Journaux" });
      await fixture.whenStable();

      expect(getTabLabels()).toEqual([tabs[0].label, "Journaux"]);
      expect(getSelectedTabLabel()).toEqual(tabs[0].label);
    });

    it("Should save the name of a tab with the Enter key, without selecting the tab", async () => {
      await loadDashboard();
      getTabs()[1].querySelector(".tab-label")?.dispatchEvent(new MouseEvent("dblclick"));
      await fixture.whenStable();
      const input = getElement<HTMLInputElement>("#tab-name-input");
      input.value = "Journaux";
      input.dispatchEvent(new Event("input"));
      await fixture.whenStable();
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      httpTestingController
        .expectOne(`${environment.backend_url}/tab/updateTab`)
        .flush({ ...tabs[1], label: "Journaux" });
      await fixture.whenStable();

      expect(getTabLabels()).toEqual([tabs[0].label, "Journaux"]);
      expect(getSelectedTabLabel()).toEqual(tabs[0].label);
    });

    it("Should delete a tab with its delete button, without selecting it first", async () => {
      await loadDashboard();
      getTabs()[1].querySelector(".tab-label")?.dispatchEvent(new MouseEvent("dblclick"));
      await fixture.whenStable();
      getElement(".delete-tab-button").click();
      httpTestingController
        .expectOne(`${environment.backend_url}/tab/deleteTab?id=${tabs[1].id}`)
        .flush(null, { status: 200, statusText: "OK" });
      await render();

      expect(getTabLabels()).toEqual([tabs[0].label]);
      expect(getSelectedTabLabel()).toEqual(tabs[0].label);
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

      dropFirstTabAfterSecond();
      const request = httpTestingController.expectOne(`${environment.backend_url}/tab/updateTabs`);
      expect(request.request.body).toEqual([
        { id: 2, label: "Météo", tabOrder: 0 },
        { id: 1, label: "Journaux", tabOrder: 1 }
      ]);
      request.flush(request.request.body);
      await fixture.whenStable();
      expect(getTabLabels()).toEqual(["Météo", "Journaux"]);
    });
  });

  describe("Widgets", () => {
    it("Should invite to add a widget when the tab is empty", async () => {
      await loadDashboard(tabs, []);
      expect(getElement("#empty-tab-message h2").textContent?.trim()).toEqual(
        "Cet onglet est vide"
      );
      expect(getElement("#empty-tab-message p").textContent?.trim()).toEqual(
        "Ajoutez un widget : météo, flux RSS, agenda, Strava…"
      );
      const addWidgetButton = getElement<HTMLButtonElement>("#empty-tab-message button");
      expect(addWidgetButton.textContent).toContain("Ajouter un widget");

      dialogResult = "WEATHER";
      addWidgetButton.click();
      const request = httpTestingController.expectOne(
        `${environment.backend_url}/widget/addWidget`
      );
      expect(request.request.body).toEqual({ type: WidgetType.WEATHER, tabId: tabs[0].id });
      request.flush({ id: 4, type: WidgetType.WEATHER, tabId: 1, widgetOrder: 1 });
      await fixture.whenStable();
      expect(getElement("#empty-tab-message")).toBeNull();
      expect(getElement("dash-widget-list")).not.toBeNull();
    });

    it("Should add the widget selected in the creation modal from the header", async () => {
      await loadDashboard();
      const openSpy = vi.spyOn(TestBed.inject(MatDialog), "open");
      dialogResult = "RSS";
      getElement<HTMLButtonElement>("#open-add-widget-modal").click();
      expect(openSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ width: "640px" })
      );
      const request = httpTestingController.expectOne(
        `${environment.backend_url}/widget/addWidget`
      );
      expect(request.request.body).toEqual({ type: WidgetType.RSS, tabId: tabs[0].id });
      request.flush({ id: 3, type: WidgetType.RSS, tabId: 1, widgetOrder: 3 });
      await fixture.whenStable();
      expect(getWidgetList().widgetList()).toHaveLength(3);
    });

    it("Should not add a widget when the creation modal is closed", async () => {
      await loadDashboard();
      getElement<HTMLButtonElement>("#open-add-widget-modal").click();
      httpTestingController.expectNone(`${environment.backend_url}/widget/addWidget`);
      await fixture.whenStable();
      expect(getWidgetList().widgetList()).toHaveLength(2);
    });

    it("Should delete a widget when its deletion is requested", async () => {
      await loadDashboard();
      TestBed.inject(WidgetService).notifyWidgetDeleted(widgets[0].id);
      httpTestingController
        .expectOne(`${environment.backend_url}/widget/deleteWidget?id=${widgets[0].id}`)
        .flush(null);
      await fixture.whenStable();
      expect(
        getWidgetList()
          .widgetList()
          .map((widget) => widget.id)
      ).toEqual([2]);
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

    it("Should refresh all the widgets", async () => {
      await loadDashboard();
      const refreshSpy = vi.fn();
      TestBed.inject(WidgetService).refreshWidgetsAction.subscribe(refreshSpy);
      getElement<HTMLButtonElement>("#reload-all-widgets-button").click();
      expect(refreshSpy).toHaveBeenCalledTimes(1);
    });

    it("Should refresh all the widgets every ten minutes", async () => {
      vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
      try {
        await loadDashboard();
        const refreshSpy = vi.fn();
        TestBed.inject(WidgetService).refreshWidgetsAction.subscribe(refreshSpy);
        vi.advanceTimersByTime(10 * 60 * 1000);
        expect(refreshSpy).toHaveBeenCalledTimes(1);

        fixture.destroy();
        vi.advanceTimersByTime(10 * 60 * 1000);
        expect(refreshSpy).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it("Should toggle the edit mode", async () => {
      await loadDashboard();
      expect(getElement("#edit-mode-banner")).toBeNull();
      expect(getElement("#validate-widget-list-button")).toBeNull();
      expect(getTabs()[0].classList).not.toContain("draggable");

      getElement<HTMLButtonElement>("#toggle-edit-mode-button").click();
      await fixture.whenStable();
      expect(getElement("#toggle-edit-mode-button")).toBeNull();
      expect(getElement("#edit-mode-banner span").textContent?.trim()).toEqual(
        "Glissez-déposez les widgets et les onglets pour les réorganiser."
      );
      expect(getTabs()[0].classList).toContain("draggable");
      expect(getWidgetList().toggleEditMode()).toBe(true);

      getElement<HTMLButtonElement>("#validate-widget-list-button").click();
      await fixture.whenStable();
      expect(getElement("#edit-mode-banner")).toBeNull();

      getElement<HTMLButtonElement>("#toggle-edit-mode-button").click();
      await fixture.whenStable();
      const finishButton = getElement<HTMLButtonElement>("#edit-mode-banner button");
      expect(finishButton.textContent?.trim()).toEqual("Terminer");
      finishButton.click();
      await fixture.whenStable();
      expect(getElement("#edit-mode-banner")).toBeNull();
      expect(getElement("#toggle-edit-mode-button")).not.toBeNull();
      expect(getWidgetList().toggleEditMode()).toBe(false);
    });
  });

  describe("Errors", () => {
    it("Should display errors when the dashboard actions fail", async () => {
      const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
      await loadDashboard([], []);

      getElement<HTMLButtonElement>("#add-new-tab-button").click();
      httpTestingController
        .expectOne(`${environment.backend_url}/tab/addTab`)
        .flush(null, serverError);
      expect(handleErrorSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 500 }),
        "Erreur lors de l'ajout d'un onglet."
      );

      await clickInUserMenu("#download-config-button");
      httpTestingController
        .expectOne(`${environment.backend_url}/dashConfig/export`)
        .flush(null, serverError);
      expect(handleErrorSpy).toHaveBeenLastCalledWith(
        expect.anything(),
        "Erreur lors de l'export de la configuration."
      );

      await fixture.whenStable();
      expect(getTabs()).toEqual([]);
      expect(handleErrorSpy).toHaveBeenCalledTimes(2);
    });

    it("Should display errors when the widget and tab actions fail", async () => {
      const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
      await loadDashboard();

      TestBed.inject(WidgetService).notifyWidgetDeleted(1);
      httpTestingController
        .expectOne(`${environment.backend_url}/widget/deleteWidget?id=1`)
        .flush(null, serverError);
      expect(handleErrorSpy).toHaveBeenLastCalledWith(
        expect.anything(),
        "Erreur lors de la suppression d'un widget."
      );

      getTabLabelElement(tabs[0]).triggerEventHandler("tabDeletedEvent", tabs[0].id);
      httpTestingController
        .expectOne(`${environment.backend_url}/tab/deleteTab?id=1`)
        .flush(null, serverError);
      expect(handleErrorSpy).toHaveBeenLastCalledWith(
        expect.anything(),
        "Erreur lors de la suppression d'un onglet."
      );

      getWidgetList().updateWidgetsOrderEvent.emit(widgets);
      httpTestingController
        .expectOne(`${environment.backend_url}/widget/updateWidgetsOrder`)
        .flush(null, serverError);
      expect(handleErrorSpy).toHaveBeenLastCalledWith(
        expect.anything(),
        "Erreur lors de la mise à jour des widgets."
      );

      dropFirstTabAfterSecond();
      httpTestingController
        .expectOne(`${environment.backend_url}/tab/updateTabs`)
        .flush(null, serverError);
      expect(handleErrorSpy).toHaveBeenLastCalledWith(
        expect.anything(),
        "Erreur lors de la mise à jour des onglets."
      );

      dialogResult = "RSS";
      getElement<HTMLButtonElement>("#open-add-widget-modal").click();
      httpTestingController
        .expectOne(`${environment.backend_url}/widget/addWidget`)
        .flush(null, serverError);
      expect(handleErrorSpy).toHaveBeenLastCalledWith(
        expect.anything(),
        "Erreur lors de l'ajout d'un widget."
      );
      expect(handleErrorSpy).toHaveBeenCalledTimes(5);

      // Nothing changed on the dashboard
      await fixture.whenStable();
      expect(getTabLabels()).toEqual(tabs.map((tab) => tab.label));
      expect(getSelectedTabLabel()).toEqual(tabs[0].label);
      expect(getWidgetList().widgetList()).toEqual(widgets);
    });
  });

  describe("Menus", () => {
    it("Should not display the notifications to a user", async () => {
      await loadDashboard();
      expect(getElement("dash-notifications")).toBeNull();
    });

    it("Should display the notifications to an admin", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ id: 1, accessToken: "token", roles: [Role.ROLE_ADMIN] })
      );
      await loadDashboard();
      expect(getElement("dash-notifications")).not.toBeNull();
    });

    it("Should display the user menu", async () => {
      await loadDashboard();
      await openUserMenu();
      expect(document.querySelector("#logout-button")?.textContent).toContain("Déconnexion");
      expect(document.querySelector("#download-config-button")?.textContent).toContain(
        "Télécharger la configuration"
      );
      expect(document.querySelector("#open-import-config-modal")?.textContent).toContain(
        "Importer une configuration"
      );
    });

    it("Should log out from the user menu", async () => {
      await loadDashboard();
      localStorage.setItem("user", JSON.stringify({ accessToken: "token" }));
      const navigateSpy = vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);
      await clickInUserMenu("#logout-button");
      await vi.waitFor(() => expect(navigateSpy).toHaveBeenCalledWith(["login"]));
      expect(localStorage.getItem("user")).toBeNull();
    });

    it("Should switch between light and dark mode", async () => {
      localStorage.removeItem("preferredTheme");
      await loadDashboard();
      await openUserMenu();
      const toggle =
        await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(
          MatSlideToggleHarness
        );
      expect(await toggle.isChecked()).toBe(false);

      await toggle.toggle();
      expect(localStorage.getItem("preferredTheme")).toEqual("dark");
      expect(document.body.classList).toContain("dark-mode");

      await toggle.toggle();
      expect(localStorage.getItem("preferredTheme")).toEqual("light");
      expect(document.body.classList).not.toContain("dark-mode");
      localStorage.removeItem("preferredTheme");
    });

    it("Should open the configuration import modal", async () => {
      await loadDashboard();
      const openSpy = vi.spyOn(TestBed.inject(MatDialog), "open");
      await clickInUserMenu("#open-import-config-modal");
      expect(openSpy).toHaveBeenCalledWith(ImportConfigModal, { width: "640px" });
    });

    it("Should export the configuration", async () => {
      await loadDashboard();
      const createObjectURL = vi.fn(() => "blob:config");
      const revokeObjectURL = vi.fn();
      vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL }));
      const clickSpy = vi
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => undefined);

      await clickInUserMenu("#download-config-button");
      httpTestingController
        .expectOne(`${environment.backend_url}/dashConfig/export`)
        .flush(new Blob(["{}"]));

      expect(createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:config");
      expect(document.querySelector("a[download]")).toBeNull();
      clickSpy.mockRestore();
      vi.unstubAllGlobals();
    });
  });
});

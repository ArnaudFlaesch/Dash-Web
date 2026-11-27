import { Location, NgOptimizedImage } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import {
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  inject,
  linkedSignal,
  signal
} from "@angular/core";
import { rxResource, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { ActivatedRoute, Router } from "@angular/router";
import { catchError, filter, of, switchMap } from "rxjs";
import { WidgetType } from "@widgets/widget-type";
import { ImportConfigModal } from "@features/home/import-config-modal/import-config-modal";
import { WidgetTypePickerModal } from "@widgets/widget-type-picker-modal/widget-type-picker-modal";
import { WidgetConfig } from "@widgets/widget-config";
import { Tab } from "@features/tab/tab";
import { Notifications } from "@features/notifications/notifications";
import { AuthService } from "@core/auth/auth-service";
import { ConfigService } from "@features/home/config-service";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { TabService } from "@features/tab/tab-service";
import { ThemeService } from "@core/theme/theme-service";
import { WidgetService } from "@widgets/widget-service";
import { TabBar } from "@features/tab/tab-bar/tab-bar";
import { HomeActionBar } from "@features/home/home-action-bar/home-action-bar";
import { MiniWidgetList } from "@widgets/mini-widget-list/mini-widget-list";
import { WidgetList } from "@widgets/widget-list/widget-list";
import { WidgetTypePickerData } from "@widgets/widget-type-picker-modal/widget-type-picker-data";
import { WIDGET_TYPE_OPTIONS } from "@widgets/widget-type-picker-modal/widget-type-options";

@Component({
  selector: "dash-home",
  templateUrl: "./home.html",
  styleUrl: "./home.scss",
  imports: [
    NgOptimizedImage,
    TabBar,
    HomeActionBar,
    MatButton,
    MatIcon,
    Notifications,
    MiniWidgetList,
    WidgetList,
    MatProgressSpinner
  ]
})
export class Home {
  private readonly REFRESH_INTERVAL = 10 * 60 * 1000;
  private readonly MODAL_WIDTH = "640px";

  protected readonly labels = {
    brandName: "Dash",
    editModeHint: "Glissez-déposez les widgets et les onglets pour les réorganiser.",
    finish: "Terminer",
    noTab: "Aucun onglet",
    noTabHint: "Créez un onglet pour commencer à composer votre dashboard.",
    createTab: "Créer un onglet",
    emptyTab: "Cet onglet est vide",
    emptyTabHint: "Ajoutez un widget : météo, flux RSS, agenda, Strava…",
    addWidget: "Ajouter un widget"
  };

  private readonly ERROR_MESSAGES = {
    initDashboard: "Erreur lors de l'initialisation du dashboard.",
    exportConfiguration: "Erreur lors de l'export de la configuration.",
    getWidgets: "Erreur lors de la récupération des widgets.",
    addWidget: "Erreur lors de l'ajout d'un widget.",
    updateWidgetsOrder: "Erreur lors de la mise à jour des widgets.",
    deleteWidget: "Erreur lors de la suppression d'un widget.",
    addTab: "Erreur lors de l'ajout d'un onglet.",
    updateTab: "Erreur lors de la modification d'un onglet.",
    updateTabs: "Erreur lors de la mise à jour des onglets.",
    deleteTab: "Erreur lors de la suppression d'un onglet."
  };

  public readonly editModeEnabled = signal(false);
  public readonly isDarkTheme = inject(ThemeService).isDarkModeEnabled;

  private readonly tabsResource = rxResource({
    stream: () =>
      this.tabService.getTabs().pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.initDashboard);
          return of([]);
        })
      ),
    defaultValue: [] as Tab[]
  });

  public readonly tabs = this.tabsResource.value;
  // The tab from the url once the tabs are loaded, then kept as long as it exists, else the first tab
  public readonly activeTab = linkedSignal<Tab[], number>({
    source: this.tabs,
    computation: (tabs, previous) => {
      const tabId =
        previous && previous.value !== -1
          ? previous.value
          : Number.parseInt(this.activatedRoute.snapshot.queryParamMap.get("tabId") ?? "");
      return tabs.some((tab) => tab.id === tabId) ? tabId : (tabs.at(0)?.id ?? -1);
    }
  });

  /** Widgets of the active tab, reloaded when another tab is selected. */
  private readonly widgetsResource = rxResource({
    params: () => (this.activeTab() === -1 ? undefined : { tabId: this.activeTab() }),
    stream: ({ params: { tabId } }) =>
      this.widgetService.getWidgets(tabId).pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.getWidgets);
          return of([]);
        })
      ),
    defaultValue: [] as WidgetConfig[]
  });

  public readonly activeWidgets = this.widgetsResource.value;
  public readonly isDashboardLoaded = computed(() => !this.tabsResource.isLoading());
  public readonly areWidgetsLoaded = computed(() => !this.widgetsResource.isLoading());
  public readonly canUserSeeNotifications = inject(AuthService).isUserAdmin;

  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly document = inject(DOCUMENT);
  private readonly authService = inject(AuthService);
  private readonly tabService = inject(TabService);
  private readonly widgetService = inject(WidgetService);
  private readonly configService = inject(ConfigService);
  private readonly themeService = inject(ThemeService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public constructor() {
    this.widgetService.widgetDeleted
      .pipe(takeUntilDestroyed())
      .subscribe((widgetId) => this.deleteWidgetFromDashboard(widgetId));

    const refreshInterval = setInterval(() => this.refreshAllWidgets(), this.REFRESH_INTERVAL);
    inject(DestroyRef).onDestroy(() => clearInterval(refreshInterval));
  }

  public addNewTab(): void {
    this.tabService.addTab("Nouvel onglet").subscribe({
      next: (insertedTab) => {
        this.tabs.update((tabs) => [...tabs, insertedTab]);
        // Also saved in the url, like a tab selected by the user
        this.selectTab(insertedTab.id);
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.addTab)
    });
  }

  public selectTab(tabId: number): void {
    if (this.activeTab() !== tabId) {
      this.activeTab.set(tabId);
      const url = this.router
        .createUrlTree([], { relativeTo: this.activatedRoute, queryParams: { tabId } })
        .toString();
      this.location.go(url);
    }
  }

  public renameTab({ id, label, tabOrder }: Tab): void {
    this.tabService.updateTab(id, label, tabOrder).subscribe({
      // Keeps the renamed tab, else its previous name would be sent back when the tabs are reordered.
      // Receiving a new tab also closes the edition of its label, which stays open on error.
      next: (updatedTab) =>
        this.tabs.update((tabs) =>
          tabs.map((tab) => (tab.id === updatedTab.id ? updatedTab : tab))
        ),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.updateTab)
    });
  }

  private deleteWidgetFromDashboard(id: number): void {
    this.widgetService.deleteWidget(id).subscribe({
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.deleteWidget),
      complete: () =>
        this.activeWidgets.update((activeWidgets) =>
          activeWidgets.filter((widget) => widget.id !== id)
        )
    });
  }

  public deleteTabFromDash(tabId: number): void {
    this.tabService.deleteTab(tabId).subscribe({
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.deleteTab),
      complete: () => this.deleteTabFromDashboard(tabId)
    });
  }

  public openCreateWidgetModal(): void {
    this.dialog
      .open<WidgetTypePickerModal, WidgetTypePickerData, keyof typeof WidgetType>(
        WidgetTypePickerModal,
        {
          width: this.MODAL_WIDTH,
          data: {
            title: this.labels.addWidget,
            widgetTypes: WIDGET_TYPE_OPTIONS
          }
        }
      )
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((type) => this.widgetService.addWidget(WidgetType[type], this.activeTab()))
      )
      .subscribe({
        next: (widget) => this.activeWidgets.update((activeWidgets) => [...activeWidgets, widget]),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.addWidget)
      });
  }

  public refreshAllWidgets(): void {
    this.widgetService.refreshAllWidgets();
  }

  public openImportConfigModal(): void {
    this.dialog.open(ImportConfigModal, { width: this.MODAL_WIDTH });
  }

  public downloadConfig(): void {
    this.configService.exportConfig().subscribe({
      next: (response) => {
        const downloadLink = this.document.createElement("a");
        downloadLink.href = URL.createObjectURL(response);
        downloadLink.download = "dashboardConfig.json";
        this.document.body.appendChild(downloadLink);
        downloadLink.click();
        URL.revokeObjectURL(downloadLink.href);
        downloadLink.remove();
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.exportConfiguration)
    });
  }

  public async logout(): Promise<void> {
    this.authService.logout();
    await this.router.navigate(["login"]);
  }

  public updateWidgetOrder(updatedWidgets: WidgetConfig[]): void {
    this.widgetService.updateWidgetsOrder(updatedWidgets).subscribe({
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.updateWidgetsOrder)
    });
  }

  public updateTabsOrder(updatedTabs: Tab[]): void {
    this.tabService.updateTabs(updatedTabs).subscribe({
      next: (tabs) => this.tabs.set(tabs),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.updateTabs)
    });
  }

  public toggleEditMode(): void {
    this.editModeEnabled.update((editModeEnabled) => !editModeEnabled);
  }

  public toggleTheme(isToggleChecked: boolean): void {
    this.themeService.selectDarkMode(isToggleChecked);
  }

  private deleteTabFromDashboard(tabId: number): void {
    const remainingTabs = this.tabs().filter((tab) => tab.id !== tabId);
    this.activeWidgets.update((widgets) => widgets.filter((widget) => widget.tabId !== tabId));
    // The first remaining tab is selected when the active tab is deleted
    if (this.activeTab() === tabId && remainingTabs.length > 0) {
      this.selectTab(remainingTabs[0].id);
    }
    this.tabs.set(remainingTabs);
  }
}

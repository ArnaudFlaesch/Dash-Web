import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from "@angular/cdk/drag-drop";
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
import { form, FormField } from "@angular/forms/signals";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatDivider } from "@angular/material/divider";
import { MatIcon } from "@angular/material/icon";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { MatTooltip } from "@angular/material/tooltip";
import { ActivatedRoute, Router } from "@angular/router";
import { catchError, filter, of, switchMap } from "rxjs";
import { WidgetTypeEnum } from "@enums/WidgetTypeEnum";
import { ImportConfigModalComponent } from "@modals/import-config-modal/import-config-modal.component";
import { WidgetTypePickerModalComponent } from "@modals/widget-type-picker-modal/widget-type-picker-modal.component";
import { IWidgetConfig } from "@model/IWidgetConfig";
import { ITab } from "@model/ITab";
import { NotificationsComponent } from "@app/notifications/notifications.component";
import { AuthService } from "@services/auth.service";
import { ConfigService } from "@services/config.service";
import { ErrorHandlerService } from "@services/error-handler.service";
import { TabService } from "@services/tab.service";
import { ThemeService } from "@services/theme.service";
import { WidgetService } from "@services/widget.service";
import { TabComponent } from "@app/tab/tab.component";
import { MiniWidgetListComponent } from "@widgets/miniwidget-list/miniwidget-list.component";
import { WidgetListComponent } from "@widgets/widget-list/widget-list.component";
import { IWidgetTypePickerData } from "@model/IWidgetTypePicker";
import { WIDGET_TYPE_OPTIONS } from "@model/WidgetTypeOptions";

@Component({
  selector: "dash-home",
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
  imports: [
    NgOptimizedImage,
    CdkDropList,
    TabComponent,
    CdkDrag,
    MatButton,
    MatIconButton,
    MatTooltip,
    MatIcon,
    MatMenuTrigger,
    NotificationsComponent,
    MatMenu,
    MatMenuItem,
    MatSlideToggle,
    MatDivider,
    MiniWidgetListComponent,
    WidgetListComponent,
    MatProgressSpinner,
    FormField
  ]
})
export class HomeComponent {
  private readonly ERROR_MESSAGES = {
    initDashboard: "Erreur lors de l'initialisation du dashboard.",
    exportConfiguration: "Erreur lors de l'export de la configuration.",
    getWidgets: "Erreur lors de la récupération des widgets.",
    addWidget: "Erreur lors de l'ajout d'un widget.",
    updateWidgetsOrder: "Erreur lors de la mise à jour des widgets.",
    deleteWidget: "Erreur lors de la suppression d'un widget.",
    addTab: "Erreur lors de l'ajout d'un onglet.",
    updateTabs: "Erreur lors de la mise à jour des onglets.",
    deleteTab: "Erreur lors de la suppression d'un onglet."
  };

  private readonly REFRESH_INTERVAL = 10 * 60 * 1000;
  private readonly MODAL_WIDTH = "640px";
  private readonly CASH_MANAGER_URL = "https://arnaudflaesch.github.io/CashManager/";

  public readonly labels = {
    brandName: "Dash",
    tabs: "Onglets",
    doubleClickToRename: "Double-cliquez pour renommer",
    addNewTab: "Ajouter un nouvel onglet",
    addNewWidget: "Ajouter un nouveau widget",
    widget: "Widget",
    validateWidgetOrder: "Valider l'ordre des widgets",
    changeWidgetOrder: "Changer l'ordre des widgets",
    refreshAllWidgets: "Réactualiser tous les widgets",
    applications: "Applications",
    userMenu: "Menu utilisateur",
    cashManager: "CashManager",
    darkTheme: "Thème sombre",
    downloadConfig: "Télécharger la configuration",
    importConfig: "Importer une configuration",
    logout: "Déconnexion",
    editModeHint: "Glissez-déposez les widgets et les onglets pour les réorganiser.",
    finish: "Terminer",
    noTab: "Aucun onglet",
    noTabHint: "Créez un onglet pour commencer à composer votre dashboard.",
    createTab: "Créer un onglet",
    emptyTab: "Cet onglet est vide",
    emptyTabHint: "Ajoutez un widget : météo, flux RSS, agenda, Strava…",
    addWidget: "Ajouter un widget"
  };

  public readonly tabsResource = rxResource({
    stream: () =>
      this.tabService.getTabs().pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.initDashboard);
          return of([]);
        })
      ),
    defaultValue: [] as ITab[]
  });

  public readonly tabs = this.tabsResource.value;
  // The tab from the url once the tabs are loaded, then kept as long as it exists, else the first tab
  public readonly activeTab = linkedSignal<ITab[], number>({
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
  public readonly widgetsResource = rxResource({
    params: () => (this.activeTab() === -1 ? undefined : { tabId: this.activeTab() }),
    stream: ({ params: { tabId } }) =>
      this.widgetService.getWidgets(tabId).pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.getWidgets);
          return of([]);
        })
      ),
    defaultValue: [] as IWidgetConfig[]
  });

  public readonly activeWidgets = this.widgetsResource.value;
  public readonly isDashboardLoaded = computed(() => !this.tabsResource.isLoading());
  public readonly areWidgetsLoaded = computed(() => !this.widgetsResource.isLoading());
  public readonly editModeEnabled = signal(false);
  public readonly isDarkTheme = linkedSignal(inject(ThemeService).isDarkModeEnabled);
  public readonly toggleThemeForm = form(this.isDarkTheme);
  public readonly cashManagerApplicationUrl = this.CASH_MANAGER_URL;
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
        this.activeTab.set(insertedTab.id);
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

  /** Keeps the renamed tab, else its previous name would be sent back when the tabs are reordered. */
  public updateTab(updatedTab: ITab): void {
    this.tabs.update((tabs) => tabs.map((tab) => (tab.id === updatedTab.id ? updatedTab : tab)));
  }

  public deleteWidgetFromDashboard(id: number): void {
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
      .open<WidgetTypePickerModalComponent, IWidgetTypePickerData, keyof typeof WidgetTypeEnum>(
        WidgetTypePickerModalComponent,
        {
          width: this.MODAL_WIDTH,
          data: {
            title: "Ajouter un widget",
            widgetTypes: WIDGET_TYPE_OPTIONS
          }
        }
      )
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((type) => this.widgetService.addWidget(WidgetTypeEnum[type], this.activeTab()))
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
    this.dialog.open(ImportConfigModalComponent, { width: this.MODAL_WIDTH });
  }

  public downloadConfig(): void {
    this.configService.exportConfig().subscribe({
      next: (response) => {
        const downloadLink = this.document.createElement("a");
        downloadLink.href = URL.createObjectURL(new Blob([response]));
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

  public updateWidgetOrder(updatedWidgets: IWidgetConfig[]): void {
    this.widgetService.updateWidgetsOrder(updatedWidgets).subscribe({
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.updateWidgetsOrder)
    });
  }

  public drop(event: CdkDragDrop<ITab[]>): void {
    const tabs = [...this.tabs()];
    moveItemInArray(tabs, event.previousIndex, event.currentIndex);
    const updatedTabs = tabs.map((tab, index) => ({ ...tab, tabOrder: index }));
    this.tabService.updateTabs(updatedTabs).subscribe({
      next: (tabs) => this.tabs.set(tabs),
      error: (error) => this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.updateTabs)
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

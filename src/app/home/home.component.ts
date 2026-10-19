import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from "@angular/cdk/drag-drop";
import { Location } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, DestroyRef, inject, linkedSignal, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { form, FormField } from "@angular/forms/signals";
import { MatMiniFabButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatDivider } from "@angular/material/divider";
import { MatIcon } from "@angular/material/icon";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { MatTooltip } from "@angular/material/tooltip";
import { ActivatedRoute, Router } from "@angular/router";
import { filter, switchMap } from "rxjs";
import { WidgetTypeEnum } from "../enums/WidgetTypeEnum";
import { CreateWidgetModalComponent } from "../modals/create-widget-modal/create-widget-modal.component";
import { ImportConfigModalComponent } from "../modals/import-config-modal/import-config-modal.component";
import { IWidgetConfig } from "../model/IWidgetConfig";
import { ITab } from "../model/Tab";
import { NotificationsComponent } from "../notifications/notifications.component";
import { AuthService } from "../services/auth.service/auth.service";
import { ConfigService } from "../services/config.service/config.service";
import { ErrorHandlerService } from "../services/error.handler.service";
import { TabService } from "../services/tab.service/tab.service";
import { ThemeService } from "../services/theme.service/theme.service";
import { WidgetService } from "../services/widget.service/widget.service";
import { TabComponent } from "../tab/tab.component";
import { MiniWidgetListComponent } from "../widgets/miniwidget-list/miniwidget-list.component";
import { WidgetListComponent } from "../widgets/widget-list/widget-list.component";

@Component({
  selector: "dash-home",
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
  imports: [
    CdkDropList,
    TabComponent,
    CdkDrag,
    MatMiniFabButton,
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
  public readonly tabs = signal<ITab[]>([]);
  public readonly activeWidgets = signal<IWidgetConfig[]>([]);
  public readonly activeTab = signal(-1);
  public readonly isDashboardLoaded = signal(false);
  public readonly areWidgetsLoaded = signal(false);
  public readonly editModeEnabled = signal(false);
  public readonly isDarkTheme = linkedSignal(inject(ThemeService).isDarkModeEnabled);
  public readonly toggleThemeForm = form(this.isDarkTheme);
  public readonly cashManagerApplicationUrl = "https://arnaudflaesch.github.io/CashManager/";
  public readonly canUserSeeNotifications = inject(AuthService).isUserAdmin;

  private readonly ERROR_MESSAGE_INIT_DASHBOARD = "Erreur lors de l'initialisation du dashboard.";
  private readonly ERROR_EXPORT_CONFIGURATION = "Erreur lors de l'export de la configuration.";
  private readonly ERROR_MESSAGE_GET_WIDGETS = "Erreur lors de la récupération des widgets.";
  private readonly ERROR_MESSAGE_ADD_WIDGET = "Erreur lors de l'ajout d'un widget.";
  private readonly ERROR_MESSAGE_UPDATE_WIDGETS_ORDER =
    "Erreur lors de la mise à jour des widgets.";
  private readonly ERROR_MESSAGE_DELETE_WIDGET = "Erreur lors de la suppression d'un widget.";
  private readonly ERROR_MESSAGE_ADD_TAB = "Erreur lors de l'ajout d'un onglet.";
  private readonly ERROR_UPDATING_TABS = "Erreurs lors de la mise à jour des onglets";
  private readonly ERROR_MESSAGE_DELETE_TAB = "Erreur lors de la suppression d'un onglet.";
  private readonly REFRESH_INTERVAL = 600000; // 10 minutes

  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly authService = inject(AuthService);
  private readonly tabService = inject(TabService);
  private readonly widgetService = inject(WidgetService);
  private readonly configService = inject(ConfigService);
  private readonly themeService = inject(ThemeService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public constructor() {
    this.initDashboard();

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
        this.activeWidgets.set([]);
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_ADD_TAB)
    });
  }

  public selectTab(tabId: number): void {
    if (this.activeTab() !== tabId) {
      this.activeTab.set(tabId);
      const url = this.router
        .createUrlTree([], { relativeTo: this.activatedRoute, queryParams: { tabId } })
        .toString();
      this.location.go(url);
      this.loadWidgets(tabId);
    }
  }

  public deleteWidgetFromDashboard(id: number): void {
    this.widgetService.deleteWidget(id).subscribe({
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_DELETE_WIDGET),
      complete: () =>
        this.activeWidgets.update((activeWidgets) =>
          activeWidgets.filter((widget) => widget.id !== id)
        )
    });
  }

  public deleteTabFromDash(tabId: number): void {
    this.tabService.deleteTab(tabId).subscribe({
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_DELETE_TAB),
      complete: () => this.deleteTabFromDashboard(tabId)
    });
  }

  public openCreateWidgetModal(): void {
    this.dialog
      .open(CreateWidgetModalComponent, { height: "400px", width: "600px" })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((type: keyof typeof WidgetTypeEnum) =>
          this.widgetService.addWidget(WidgetTypeEnum[type], this.activeTab())
        )
      )
      .subscribe({
        next: (widget) => this.activeWidgets.update((activeWidgets) => [...activeWidgets, widget]),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_ADD_WIDGET)
      });
  }

  public refreshAllWidgets(): void {
    this.widgetService.refreshAllWidgets();
  }

  public openImportConfigModal(): void {
    this.dialog.open(ImportConfigModalComponent, { height: "400px", width: "600px" });
  }

  public downloadConfig(): void {
    this.configService.exportConfig().subscribe({
      next: (response) => {
        console.info("Configuration exportée");
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(new Blob([response]));
        downloadLink.download = "dashboardConfig.json";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        URL.revokeObjectURL(downloadLink.href);
        downloadLink.remove();
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_EXPORT_CONFIGURATION)
    });
  }

  public async logout(): Promise<void> {
    this.authService.logout();
    await this.router.navigate(["login"]);
  }

  public updateWidgetOrder(updatedWidgets: IWidgetConfig[]): void {
    this.widgetService.updateWidgetsOrder(updatedWidgets).subscribe({
      error: (error) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_UPDATE_WIDGETS_ORDER)
    });
  }

  public drop(event: CdkDragDrop<ITab[]>): void {
    const tabs = [...this.tabs()];
    moveItemInArray(tabs, event.previousIndex, event.currentIndex);
    const updatedTabs = tabs.map((tab, index) => ({ ...tab, tabOrder: index }));
    this.tabService.updateTabs(updatedTabs).subscribe({
      next: (tabs) => this.tabs.set(tabs),
      error: (error) => this.errorHandlerService.handleError(error, this.ERROR_UPDATING_TABS)
    });
  }

  public toggleEditMode(): void {
    this.editModeEnabled.update((editModeEnabled) => !editModeEnabled);
  }

  public toggleTheme(isToggleChecked: boolean): void {
    this.themeService.selectDarkMode(isToggleChecked);
  }

  private initDashboard(): void {
    this.tabService.getTabs().subscribe({
      next: (tabs) => {
        this.tabs.set(tabs);
        if (tabs.length) {
          const tabIdParam = Number.parseInt(
            this.activatedRoute.snapshot.queryParamMap.get("tabId") ?? ""
          );
          this.activeTab.set(tabs.some((tab) => tab.id === tabIdParam) ? tabIdParam : tabs[0].id);
          this.loadWidgets(this.activeTab());
        } else {
          this.areWidgetsLoaded.set(true);
        }
        this.isDashboardLoaded.set(true);
      },
      error: (error: HttpErrorResponse) => {
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_INIT_DASHBOARD);
        this.isDashboardLoaded.set(true);
      }
    });
  }

  private loadWidgets(activeTabId: number): void {
    this.activeWidgets.set([]);
    this.areWidgetsLoaded.set(false);
    this.widgetService.getWidgets(activeTabId).subscribe({
      next: (widgets) => {
        this.activeWidgets.set(widgets);
        this.areWidgetsLoaded.set(true);
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_GET_WIDGETS)
    });
  }

  private deleteTabFromDashboard(tabId: number): void {
    const tabs = this.tabs();
    this.activeWidgets.update((widgets) => widgets.filter((widget) => widget.tabId !== tabId));
    if (tabs.length > 1) {
      if (tabs[0].id === tabId) {
        this.selectTab(tabs[1].id);
      } else if (this.activeTab() === tabId) {
        this.selectTab(tabs[0].id);
      }
    }
    this.tabs.set(tabs.filter((tab) => tab.id !== tabId));
  }
}

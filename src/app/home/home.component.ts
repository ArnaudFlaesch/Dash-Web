import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { Location, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { WidgetTypeEnum } from '../enums/WidgetTypeEnum';
import { ErrorHandlerService } from '../services/error.handler.service';
import { TabService } from '../services/tab.service/tab.service';
import { ThemeService } from '../services/theme.service/theme.service';
import { WidgetService } from '../services/widget.service/widget.service';
import { CreateWidgetModalComponent } from './../modals/create-widget-modal/create-widget-modal.component';
import { ImportConfigModalComponent } from './../modals/import-config-modal/import-config-modal.component';
import { IWidgetConfig } from './../model/IWidgetConfig';
import { ITab } from './../model/Tab';
import { AuthService } from './../services/auth.service/auth.service';
import { ConfigService } from './../services/config.service/config.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { WidgetListComponent } from '../widgets/widget-list/widget-list.component';
import { MiniWidgetListComponent } from '../widgets/miniwidget-list/miniwidget-list.component';
import { MatDivider } from '@angular/material/divider';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { NotificationsComponent } from '../notifications/notifications.component';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMiniFabButton } from '@angular/material/button';
import { TabComponent } from '../tab/tab.component';

@Component({
  selector: 'dash-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [
    CdkDropList,
    TabComponent,
    CdkDrag,
    NgClass,
    MatMiniFabButton,
    MatTooltip,
    MatIcon,
    MatMenuTrigger,
    NotificationsComponent,
    MatMenu,
    MatMenuItem,
    MatSlideToggle,
    FormsModule,
    ReactiveFormsModule,
    MatDivider,
    MiniWidgetListComponent,
    WidgetListComponent,
    MatProgressSpinner
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private location = inject(Location);
  private authService = inject(AuthService);
  private tabService = inject(TabService);
  private widgetService = inject(WidgetService);
  private configService = inject(ConfigService);
  private themeService = inject(ThemeService);
  private errorHandlerService = inject(ErrorHandlerService);

  public tabs: ITab[] = [];
  public activeWidgets: IWidgetConfig[] = [];
  public activeTab = -1;

  public isDashboardLoaded = false;
  public areWidgetsLoaded = false;
  public editModeEnabled = false;

  public toggleControl = new FormControl(false);

  public cashManagerApplicationUrl = 'https://arnaudflaesch.github.io/CashManager/';

  private refreshInterval: NodeJS.Timeout | null = null;

  private destroy$: Subject<unknown> = new Subject();

  private ERROR_MESSAGE_INIT_DASHBOARD = "Erreur lors de l'initialisation du dashboard.";
  private ERROR_EXPORT_CONFIGURATION = "Erreur lors de l'export de la configuration.";

  private ERROR_MESSAGE_GET_WIDGETS = 'Erreur lors de la récupération des widgets.';
  private ERROR_MESSAGE_ADD_WIDGET = "Erreur lors de l'ajout d'un widget.";
  private ERROR_MESSAGE_UPDATE_WIDGETS_ORDER = 'Erreur lors de la mise à jour des widgets.';
  private ERROR_MESSAGE_DELETE_WIDGET = "Erreur lors de la suppression d'un widget.";

  private ERROR_MESSAGE_ADD_TAB = "Erreur lors de l'ajout d'un onglet.";
  private ERROR_UPDATING_TABS = 'Erreurs lors de la mise à jour des onglets';
  private ERROR_MESSAGE_DELETE_TAB = "Erreur lors de la suppression d'un onglet.";
  private readonly refreshTimeout = 600000; // 10 minutes

  constructor() {
    this.initDashboard();
  }

  ngOnInit(): void {
    this.widgetService.widgetDeleted.pipe(takeUntil(this.destroy$)).subscribe({
      next: (widgetId) => this.deleteWidgetFromDashboard(widgetId)
    });
    this.setupWidgetAutoRefresh();
    this.toggleControl.setValue(this.themeService.isPreferredThemeDarkMode());
  }

  ngOnDestroy(): void {
    this.clearWidgetAutoRefresh();
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  public setupWidgetAutoRefresh(): void {
    this.refreshInterval = setInterval(this.refreshAllWidgets.bind(this), this.refreshTimeout);
  }

  public clearWidgetAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  public addNewTab(): void {
    const newTabLabel = 'Nouvel onglet';
    this.tabService.addTab(newTabLabel).subscribe({
      next: (insertedTab: ITab) => {
        this.tabs = [...this.tabs, insertedTab];
        this.activeTab = insertedTab.id;
        this.activeWidgets = [];
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_ADD_TAB)
    });
  }

  public selectTab(tabId: number): void {
    if (this.activeTab !== tabId) {
      this.activeTab = tabId;
      const url = this.router
        .createUrlTree([], {
          relativeTo: this.activatedRoute,
          queryParams: { tabId: tabId }
        })
        .toString();
      this.location.go(url);
      this.loadWidgets(this.activeTab);
    }
  }

  public deleteWidgetFromDashboard(id: number): void {
    this.widgetService.deleteWidget(id).subscribe({
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_DELETE_WIDGET),
      complete: () =>
        (this.activeWidgets = this.activeWidgets.filter(
          (widget: IWidgetConfig) => widget.id !== id
        ))
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
    const dialogRef = this.dialog.open(CreateWidgetModalComponent, {
      height: '400px',
      width: '600px'
    });

    dialogRef.afterClosed().subscribe((result: WidgetTypeEnum) => {
      if (result) {
        const type = WidgetTypeEnum[result];
        this.widgetService.addWidget(type, this.activeTab).subscribe({
          next: (response: IWidgetConfig) => {
            this.activeWidgets = [...this.activeWidgets, response];
          },
          error: (error: HttpErrorResponse) =>
            this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_ADD_WIDGET)
        });
      }
    });
  }

  public refreshAllWidgets(): void {
    this.widgetService._refreshWidgetsAction.next(null);
  }

  public openImportConfigModal(): void {
    this.dialog.open(ImportConfigModalComponent, {
      height: '400px',
      width: '600px'
    });
  }

  public downloadConfig(): void {
    this.configService.exportConfig().subscribe({
      next: (response) => {
        console.info('Configuration exportée');
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'dashboardConfig.json');
        document.body.innerText += link;
        link.click();
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_EXPORT_CONFIGURATION)
    });
  }

  public async logout(): Promise<void> {
    this.authService.logout();
    await this.router.navigate(['login']);
  }

  public updateWidgetOrder(updatedWidgets: IWidgetConfig[]): void {
    this.widgetService.updateWidgetsOrder(updatedWidgets).subscribe({
      error: (error) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_UPDATE_WIDGETS_ORDER)
    });
  }

  public drop(event: CdkDragDrop<ITab[]>): void {
    moveItemInArray(this.tabs, event.previousIndex, event.currentIndex);
    const updatedTabs = this.tabs.map((tab: ITab, index: number) => {
      tab.tabOrder = index;
      return tab;
    });
    this.tabService.updateTabs(updatedTabs).subscribe({
      next: (tabs: ITab[]) => (this.tabs = tabs),
      error: (error) => this.errorHandlerService.handleError(error, this.ERROR_UPDATING_TABS)
    });
  }

  public toggleEditMode(): void {
    this.editModeEnabled = !this.editModeEnabled;
  }

  public toggleTheme(isToggleChecked: boolean): void {
    this.themeService.selectDarkMode(isToggleChecked);
  }

  public canUserSeeNotifications(): boolean {
    return this.authService.isUserAdmin();
  }

  private initDashboard(): void {
    this.tabService.getTabs().subscribe({
      next: (tabs) => {
        this.tabs = tabs;
        if (tabs.length) {
          this.activatedRoute.queryParams.subscribe((params) => {
            const tabIdParam = params['tabId'];
            if (tabIdParam && tabs.find((tab) => tab.id === Number.parseInt(tabIdParam))) {
              this.activeTab = Number.parseInt(tabIdParam);
            } else {
              this.activeTab = tabs[0].id;
            }
          });
          this.loadWidgets(this.activeTab);
        } else {
          this.areWidgetsLoaded = true;
        }
        this.isDashboardLoaded = true;
      },
      error: (error: HttpErrorResponse) => {
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_INIT_DASHBOARD);
        this.isDashboardLoaded = true;
      }
    });
  }

  private loadWidgets(activeTabId: number): void {
    this.activeWidgets = [];
    this.areWidgetsLoaded = false;
    this.widgetService.getWidgets(activeTabId).subscribe({
      next: (widgets) => {
        this.activeWidgets = widgets;
        this.areWidgetsLoaded = true;
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_GET_WIDGETS)
    });
  }

  private deleteTabFromDashboard(tabId: number): void {
    this.activeWidgets = this.activeWidgets.filter(
      (widget: IWidgetConfig) => widget.tabId !== tabId
    );
    if (this.tabs.length > 1) {
      if (this.tabs[0].id === tabId) {
        this.selectTab(this.tabs[1].id);
      } else if (this.activeTab === tabId) {
        this.selectTab(this.tabs[0].id);
      }
    }
    this.tabs = this.tabs.filter((tab) => tab.id !== tabId);
  }
}

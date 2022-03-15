import { ErrorHandlerService } from '../services/error.handler.service';
import { ImportConfigModalComponent } from './../modals/import-config-modal/import-config-modal.component';
import { ConfigService } from './../services/config.service/config.service';
import { WidgetTypes } from './../enums/WidgetsEnum';
import { CreateWidgetModalComponent } from './../modals/create-widget-modal/create-widget-modal.component';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TabService } from '../services/tab.service/tab.service';
import { WidgetService } from '../services/widget.service/widget.service';
import { IWidgetConfig } from './../model/IWidgetConfig';
import { ITab } from './../model/Tab';
import { AuthService } from './../services/auth.service/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  public tabs: ITab[] = [];
  public activeWidgets: IWidgetConfig[] = [];
  public activeTab = -1;

  private refreshTimeout = 900000; // 15 minutes

  private ERROR_MESSAGE_INIT_DASHBOARD = "Erreur lors de l'initialisation du dashboard.";
  private ERROR_MESSAGE_ADD_TAB = "Erreur lors de l'ajout d'un onglet.";
  private ERROR_MESSAGE_DELETE_TAB = "Erreur lors de la suppression d'un onglet.";
  private ERROR_MESSAGE_ADD_WIDGET = "Erreur lors de l'ajout d'un widget.";
  private ERROR_EXPORT_CONFIGURATION = "Erreur lors de l'export de la configuration.";
  private ERROR_MESSAGE_DELETE_WIDGET = "Erreur lors de la suppression d'un widget.";

  private ERROR_MESSAGE_GET_WIDGETS = 'Erreur lors de la récupération des widgets.';

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private authService: AuthService,
    private tabService: TabService,
    private widgetService: WidgetService,
    private configService: ConfigService,
    private errorHandlerService: ErrorHandlerService
  ) {
    this.initDashboard();
  }

  public ngOnInit(): void {
    this.widgetService.widgetDeleted.subscribe({
      next: (widgetId) => this.deleteWidgetFromDashboard(widgetId)
    });
  }

  public ngOnDestroy(): void {
    console.log('ondestroy home');
  }

  private initDashboard() {
    this.tabService.getTabs().subscribe({
      next: (tabs) => {
        this.tabs = tabs;
        if (tabs.length) {
          this.activeTab = tabs[0].id;
          this.loadWidgets(this.activeTab);
        }
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error.message, this.ERROR_MESSAGE_INIT_DASHBOARD)
    });
  }

  public addNewTab() {
    const newTabLabel = 'Nouvel onglet';
    this.tabService.addTab(newTabLabel).subscribe({
      next: (insertedTab: ITab) => {
        this.tabs = [...this.tabs, insertedTab];
        this.activeTab = insertedTab.id;
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error.message, this.ERROR_MESSAGE_ADD_TAB)
    });
  }

  public selectTab(tabId: number) {
    this.activeTab = tabId;
    this.loadWidgets(this.activeTab);
  }

  private loadWidgets(activeTabId: number) {
    this.widgetService.getWidgets(activeTabId).subscribe({
      next: (widgets) => (this.activeWidgets = widgets),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error.message, this.ERROR_MESSAGE_GET_WIDGETS)
    });
  }

  public deleteWidgetFromDashboard(id: number): void {
    this.widgetService.deleteWidget(id).subscribe({
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error.message, this.ERROR_MESSAGE_DELETE_WIDGET),
      complete: () =>
        (this.activeWidgets = this.activeWidgets.filter(
          (widget: IWidgetConfig) => widget.id !== id
        ))
    });
  }

  public deleteTabFromDash(tabId: number): void {
    this.tabService.deleteTab(tabId).subscribe({
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error.message, this.ERROR_MESSAGE_DELETE_TAB),
      complete: () => this.deleteTabFromDashboard(tabId)
    });
  }

  private deleteTabFromDashboard(tabId: number) {
    this.activeWidgets = this.activeWidgets.filter(
      (widget: IWidgetConfig) => widget.tab.id !== tabId
    );
    this.tabs = this.tabs.filter((tab) => tab.id !== tabId);
  }

  public openCreateWidgetModal(): void {
    const dialogRef = this.dialog.open(CreateWidgetModalComponent, {
      height: '400px',
      width: '600px'
    });

    dialogRef.afterClosed().subscribe((result: WidgetTypes) => {
      const type = WidgetTypes[result];
      this.widgetService.addWidget(type, this.activeTab).subscribe({
        next: (response: IWidgetConfig) => {
          this.activeWidgets = [...this.activeWidgets, response];
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_MESSAGE_ADD_WIDGET)
      });
    });
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
        document.body.appendChild(link);
        link.click();
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error.message, this.ERROR_EXPORT_CONFIGURATION)
    });
  }

  public logout() {
    this.authService.logout();
    this.router.navigate(['login']);
  }
}

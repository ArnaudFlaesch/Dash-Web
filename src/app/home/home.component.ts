import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TabService } from '../services/tab.service/tab.service';
import { IWidgetConfig } from './../model/IWidgetConfig';
import { ITab } from './../model/Tab';
import { AuthService } from './../services/auth.service/auth.service';
import { WidgetService } from './../services/widget.service/widget.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  public tabs: ITab[] = [];
  public activeWidgets: IWidgetConfig[] = [];
  public activeTab = -1;

  private refreshTimeout = 900000; // 15 minutes

  private ERROR_MESSAGE_INIT_DASHBOARD = "Erreur lors de l'initialisation du dashboard.";
  private ERROR_MESSAGE_ADD_TAB = "Erreur lors de l'ajout d'un onglet.";
  private ERROR_MESSAGE_ADD_WIDGET = "Erreur lors de l'ajout d'un widget.";
  private ERROR_EXPORT_CONFIGURATION = "Erreur lors de l'export de la configuration.";

  private ERROR_MESSAGE_GET_WIDGETS = 'Erreur lors de la récupération des widgets.';
  private ERROR_MESSAGE_DELETE_WIDGET = "Erreur lors de la suppression d'un widget.";

  constructor(
    private router: Router,
    private authService: AuthService,
    private tabService: TabService,
    private widgetService: WidgetService,
    private snabbar: MatSnackBar
  ) {
    this.initDashboard();
  }

  private initDashboard() {
    this.tabService.getTabs().subscribe({
      next: (tabs) => {
        this.tabs = tabs;
        this.activeTab = tabs[0].id;
        this.getWidgets(this.activeTab);
      },
      error: () => {
        this.snabbar.open(this.ERROR_MESSAGE_INIT_DASHBOARD);
      }
    });
  }

  public selectTab(tabId: number) {
    this.activeTab = tabId;
    this.getWidgets(this.activeTab);
  }

  public deleteWidgetFromDashboard(id: number): void {
    this.widgetService.deleteWidget(id).subscribe({
      next: (response) => {
        if (response) {
          this.activeWidgets = this.activeWidgets.filter(
            (widget: IWidgetConfig) => widget.id !== id
          );
        }
      },
      error: (error: Error) => console.log(this.ERROR_MESSAGE_DELETE_WIDGET)
    });
  }

  private getWidgets(activeTabId: number) {
    this.widgetService.getWidgets(activeTabId).subscribe({
      next: (widgets) => {
        this.activeWidgets = widgets;
      },
      error: () => {
        this.snabbar.open(this.ERROR_MESSAGE_GET_WIDGETS);
      }
    });
  }

  public logout() {
    this.authService.logout();
    this.router.navigate(['login']);
  }
}

import { ITab } from './../model/Tab';
import { Router } from '@angular/router';
import { AuthService } from './../services/auth.service/auth.service';
import { Component, OnDestroy } from '@angular/core';
import { TabService } from '../services/tab.service/tab.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnDestroy {
  public tabs: ITab[] = [];
  public activeTab = -1;

  //private interval: NodeJS.Timer;
  private refreshTimeout = 900000; // 15 minutes

  private ERROR_MESSAGE_INIT_DASHBOARD =
    "Erreur lors de l'initialisation du dashboard.";
  private ERROR_MESSAGE_ADD_TAB = "Erreur lors de l'ajout d'un onglet.";
  private ERROR_MESSAGE_ADD_WIDGET = "Erreur lors de l'ajout d'un widget.";
  private ERROR_EXPORT_CONFIGURATION =
    "Erreur lors de l'export de la configuration.";

  constructor(
    private router: Router,
    private authService: AuthService,
    private tabService: TabService,
    private snabbar: MatSnackBar
  ) {
    this.initDashboard();
    //  this.interval = setInterval(this.refreshAllWidgets, this.refreshTimeout);
  }

  ngOnDestroy(): void {
    //clearInterval(this.interval);
  }

  private initDashboard() {
    this.tabService.getTabs().subscribe({
      next: (tabs) => {
        console.log('ici');
        this.tabs = tabs;
        this.activeTab = tabs[0].id;
      },
      error: (error) => {
        this.snabbar.open(this.ERROR_MESSAGE_INIT_DASHBOARD);
      }
    });
  }

  public refreshAllWidgets() {
    console.log('refresh');
  }

  public logout() {
    this.authService.logout();
    this.router.navigate(['login']);
  }
}

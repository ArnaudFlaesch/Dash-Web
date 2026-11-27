import { Component, input, linkedSignal, output } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatDivider } from "@angular/material/divider";
import { MatIcon } from "@angular/material/icon";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { MatTooltip } from "@angular/material/tooltip";

/** Action buttons of the dashboard header; the projected content is displayed before the menus. */
@Component({
  selector: "dash-home-action-bar",
  templateUrl: "./home-action-bar.html",
  styleUrl: "./home-action-bar.scss",
  imports: [
    MatButton,
    MatIconButton,
    MatTooltip,
    MatIcon,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatSlideToggle,
    MatDivider,
    FormField
  ]
})
export class HomeActionBar {
  private readonly CASH_MANAGER_URL = "https://arnaudflaesch.github.io/CashManager/";

  protected readonly labels = {
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
    logout: "Déconnexion"
  };

  /** A widget can only be added to a tab. */
  public readonly canAddWidget = input(false);
  public readonly editModeEnabled = input(false);
  public readonly isDarkTheme = input(false);

  public readonly newWidgetRequested = output();
  public readonly editModeToggled = output();
  public readonly refreshRequested = output();
  public readonly darkThemeToggled = output<boolean>();
  public readonly configDownloadRequested = output();
  public readonly configImportRequested = output();
  public readonly logoutRequested = output();

  private readonly darkTheme = linkedSignal(() => this.isDarkTheme());
  public readonly toggleThemeForm = form(this.darkTheme);

  public readonly cashManagerApplicationUrl = this.CASH_MANAGER_URL;
}

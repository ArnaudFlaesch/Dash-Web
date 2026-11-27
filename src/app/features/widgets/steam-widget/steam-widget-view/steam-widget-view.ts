import { Component, input, output } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatAccordion } from "@angular/material/expansion";
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatTooltip } from "@angular/material/tooltip";
import { Achievement, GameInfoDisplay } from "../steam";
import { GameDetails } from "../game-details/game-details";

@Component({
  selector: "dash-steam-widget-view",
  templateUrl: "./steam-widget-view.html",
  styleUrl: "./steam-widget-view.scss",
  imports: [
    MatFormField,
    MatLabel,
    MatPrefix,
    MatSuffix,
    MatInput,
    MatIconButton,
    MatTooltip,
    MatIcon,
    GameDetails,
    MatAccordion,
    MatPaginator,
    MatProgressSpinner
  ]
})
export class SteamWidgetView {
  protected readonly labels = {
    searchGame: "Recherchez un jeu",
    cancelSearch: "Annuler la recherche",
    noGameFound: "Aucun jeu trouvé",
    selectPage: "Sélectionnez une page"
  };

  /** Search typed by the user, not debounced. */
  public readonly searchQuery = input.required<string>();
  /** Whether the games can be displayed: they need a Steam user and its player. */
  public readonly isGamesListDisplayed = input.required<boolean>();
  /** True while a page of games is loading. */
  public readonly isGamesLoading = input.required<boolean>();
  public readonly games = input.required<GameInfoDisplay[]>();
  public readonly gameCount = input.required<number>();
  public readonly pageNumber = input.required<number>();
  /** Achievements already loaded, by appid of their game. */
  public readonly achievementsByAppId = input.required<Readonly<Record<string, Achievement[]>>>();
  /** Appids of the games whose achievements are loading. */
  public readonly loadingAchievementsAppIds = input.required<ReadonlySet<string>>();

  public readonly searchChanged = output<string>();
  public readonly searchReset = output();
  /** Index of the page selected in the paginator. */
  public readonly pageChanged = output<number>();
  /** Appid of the game whose achievements are requested. */
  public readonly achievementsRequested = output<string>();

  public readonly pageSize = 25;
  public readonly pageSizeOptions = [this.pageSize];

  public onSearchInput(event: Event): void {
    this.searchChanged.emit((event.target as HTMLInputElement).value);
  }

  public onPageChanged(event: PageEvent): void {
    this.pageChanged.emit(event.pageIndex);
  }
}

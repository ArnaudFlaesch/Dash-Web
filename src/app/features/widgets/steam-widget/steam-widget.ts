import { NgOptimizedImage } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, linkedSignal, signal } from "@angular/core";
import { rxResource, toObservable, toSignal } from "@angular/core/rxjs-interop";
import { form, FormField } from "@angular/forms/signals";
import { requiredText } from "@shared/forms/form-validators";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { catchError, debounceTime, distinctUntilChanged, map, of } from "rxjs";

import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { GameInfoDisplay, GameInfoResponse, PlayerDataResponse } from "./steam";
import { SteamWidgetService } from "./steam-widget-service";
import { GameDetails } from "./game-details/game-details";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { MatIconButton } from "@angular/material/button";
import { MatInput } from "@angular/material/input";
import { MatAccordion } from "@angular/material/expansion";
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from "@angular/material/form-field";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { Widget } from "@widgets/widget/widget";
import { injectWidgetData } from "@widgets/widget-tokens";

@Component({
  selector: "dash-steam-widget",
  templateUrl: "./steam-widget.html",
  styleUrl: "./steam-widget.scss",
  imports: [
    NgOptimizedImage,
    Widget,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatSuffix,
    MatInput,
    FormField,
    MatIconButton,
    MatTooltip,
    MatIcon,
    GameDetails,
    MatAccordion,
    MatPaginator,
    MatProgressSpinner
  ]
})
export class SteamWidget {
  protected readonly labels = {
    steamUser: "Utilisateur Steam",
    enterSteamUserId: "Saisissez l'ID utilisateur du joueur Steam",
    searchGame: "Recherchez un jeu",
    cancelSearch: "Annuler la recherche",
    noGameFound: "Aucun jeu trouvé",
    selectPage: "Sélectionnez une page"
  };

  protected readonly config = signal({ steamUserId: injectWidgetData("steamUserId", "") });
  protected readonly configForm = form(this.config, (path) => requiredText(path.steamUserId));
  protected readonly searchQuery = signal("");
  protected readonly searchForm = form(this.searchQuery);

  protected readonly pageSize = 25;
  protected readonly pageSizeOptions = [this.pageSize];
  // Back to the first page when the search changes
  protected readonly pageNumber = linkedSignal({
    source: () => this.debouncedSearchQuery(),
    computation: () => 0
  });

  /** Player of the Steam user saved on the last refresh, reloaded on each refresh. */
  private readonly playerDataResource = rxResource({
    params: () => this.refreshedSteamUser(),
    stream: ({ params: { steamUserId } }) =>
      this.steamWidgetService.getPlayerData(steamUserId).pipe(
        map((response: PlayerDataResponse[]) => response.at(0)),
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_PLAYER_DATA);
          return of(undefined);
        })
      )
  });

  /** Page of the owned games matching the search, reloaded on each refresh. */
  private readonly ownedGamesResource = rxResource({
    params: () => {
      const refreshedSteamUser = this.refreshedSteamUser();
      return (
        refreshedSteamUser && {
          ...refreshedSteamUser,
          search: this.debouncedSearchQuery() || undefined,
          pageNumber: this.pageNumber()
        }
      );
    },
    stream: ({ params: { steamUserId, search, pageNumber } }) =>
      this.steamWidgetService.getOwnedGames(steamUserId, search, pageNumber).pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_OWNED_GAMES);
          return of(undefined);
        })
      )
  });

  protected readonly playerData = this.playerDataResource.value;
  // True while a page of games is loading, until the response or the error is received
  protected readonly isOwnedGamesLoading = this.ownedGamesResource.isLoading;
  protected readonly gameCount = computed(
    () => this.ownedGamesResource.value()?.totalElements ?? 0
  );
  protected readonly ownedGamesDisplay = computed<GameInfoDisplay[]>(() =>
    (this.ownedGamesResource.value()?.content ?? []).map((game) =>
      this.gameInfoResponseToGameInfoDisplay(game)
    )
  );

  protected readonly isFormValid = computed(() => this.configForm().valid());
  protected readonly widgetData = computed(() => (this.isFormValid() ? this.config() : undefined));

  // A new object on each refresh, so that the resources reload even if the user is unchanged
  private readonly refreshedSteamUser = signal<{ steamUserId: string } | undefined>(undefined);
  private readonly debouncedSearchQuery = toSignal(
    toObservable(this.searchQuery).pipe(debounceTime(500), distinctUntilChanged()),
    { initialValue: "" }
  );

  private readonly ERROR_GETTING_PLAYER_DATA =
    "Erreur lors de la récupération de vos informations Steam.";
  private readonly ERROR_GETTING_OWNED_GAMES =
    "Erreur lors de la récupération de la liste des jeux.";

  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly steamWidgetService = inject(SteamWidgetService);

  protected refreshWidget(): void {
    const { steamUserId } = this.config();
    if (steamUserId) {
      this.refreshedSteamUser.set({ steamUserId });
    }
  }

  protected onPageChanged(event: PageEvent): void {
    if (this.refreshedSteamUser()) {
      this.pageNumber.set(event.pageIndex);
    }
  }

  protected resetForm(): void {
    this.searchQuery.set("");
  }

  private gameInfoResponseToGameInfoDisplay(gameInfoResponse: GameInfoResponse): GameInfoDisplay {
    const appIdLink = this.steamWidgetService.STEAM_COMMUNITY_URL + gameInfoResponse.appid;
    const playerAchievementUrl = `${this.playerData()?.profileurl}stats/${gameInfoResponse.appid}/achievements/`;
    const gameImgSrc = `${this.steamWidgetService.STEAM_IMAGE_URL}${gameInfoResponse.appid}/${gameInfoResponse.imgIconUrl}.jpg`;
    return { ...gameInfoResponse, appIdLink, playerAchievementUrl, gameImgSrc };
  }
}

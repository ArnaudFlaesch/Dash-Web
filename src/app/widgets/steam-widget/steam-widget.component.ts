import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, linkedSignal, signal } from "@angular/core";
import { rxResource, toObservable, toSignal } from "@angular/core/rxjs-interop";
import { form, FormField } from "@angular/forms/signals";
import { requiredText } from "../../utils/form-validators";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { catchError, map, of } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

import { ErrorHandlerService } from "../../services/error.handler.service";
import { IGameInfoDisplay, IGameInfoResponse, IPlayerDataResponse } from "./ISteam";
import { SteamWidgetService } from "./steam.widget.service";
import { GameDetailsComponent } from "./game-details/game-details.component";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { MatIconButton } from "@angular/material/button";
import { MatInput } from "@angular/material/input";
import { MatAccordion } from "@angular/material/expansion";
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from "@angular/material/form-field";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { WidgetComponent } from "../widget/widget.component";
import { injectWidgetData } from "../widget.tokens";

@Component({
  selector: "dash-steam-widget",
  templateUrl: "./steam-widget.component.html",
  styleUrl: "./steam-widget.component.scss",
  imports: [
    WidgetComponent,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatSuffix,
    MatInput,
    FormField,
    MatIconButton,
    MatTooltip,
    MatIcon,
    GameDetailsComponent,
    MatAccordion,
    MatPaginator,
    MatProgressSpinner
  ]
})
export class SteamWidgetComponent {
  public readonly config = signal({ steamUserId: injectWidgetData("steamUserId", "") });
  public readonly configForm = form(this.config, (path) => requiredText(path.steamUserId));
  public readonly searchQuery = signal("");
  public readonly searchForm = form(this.searchQuery);

  public readonly pageSize = 25;
  public readonly pageSizeOptions = [this.pageSize];
  // Back to the first page when the search changes
  public readonly pageNumber = linkedSignal({
    source: () => this.debouncedSearchQuery(),
    computation: () => 0
  });

  /** Player of the Steam user saved on the last refresh, reloaded on each refresh. */
  public readonly playerDataResource = rxResource({
    params: () => this.refreshedSteamUser(),
    stream: ({ params: { steamUserId } }) =>
      this.steamWidgetService.getPlayerData(steamUserId).pipe(
        map((response: IPlayerDataResponse[]) => response.at(0)),
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_PLAYER_DATA);
          return of(undefined);
        })
      )
  });

  /** Page of the owned games matching the search, reloaded on each refresh. */
  public readonly ownedGamesResource = rxResource({
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

  public readonly playerData = this.playerDataResource.value;
  // True while a page of games is loading, until the response or the error is received
  public readonly isOwnedGamesLoading = this.ownedGamesResource.isLoading;
  public readonly gameCount = computed(() => this.ownedGamesResource.value()?.totalElements ?? 0);
  public readonly ownedGamesDisplay = computed<IGameInfoDisplay[]>(() =>
    (this.ownedGamesResource.value()?.content ?? []).map((game) =>
      this.gameInfoResponseToGameInfoDisplay(game)
    )
  );

  public readonly isFormValid = computed(() => this.configForm().valid());

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

  public refreshWidget(): void {
    const { steamUserId } = this.config();
    if (steamUserId) {
      this.refreshedSteamUser.set({ steamUserId });
    }
  }

  public onPageChanged(event: PageEvent): void {
    if (this.refreshedSteamUser()) {
      this.pageNumber.set(event.pageIndex);
    }
  }

  public resetForm(): void {
    this.searchQuery.set("");
  }

  public getWidgetData(): { steamUserId: string } | undefined {
    return this.isFormValid() ? this.config() : undefined;
  }

  private gameInfoResponseToGameInfoDisplay(gameInfoResponse: IGameInfoResponse): IGameInfoDisplay {
    const appIdLink = this.steamWidgetService.STEAM_COMMUNITY_URL + gameInfoResponse.appid;
    const playerAchievementUrl = `${this.playerData()?.profileurl}stats/${gameInfoResponse.appid}/achievements/`;
    const gameImgSrc = `${this.steamWidgetService.STEAM_IMAGE_URL}${gameInfoResponse.appid}/${gameInfoResponse.imgIconUrl}.jpg`;
    return { ...gameInfoResponse, appIdLink, playerAchievementUrl, gameImgSrc };
  }
}

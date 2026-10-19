import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, signal } from "@angular/core";
import { toObservable, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { form, FormField } from "@angular/forms/signals";
import { requiredText } from "../../utils/form-validators";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

import { ErrorHandlerService } from "../../services/error.handler.service";
import { IGameInfoDisplay, IGameInfoResponse, IPlayerDataResponse } from "./ISteam";
import { SteamWidgetService } from "./steam.widget.service";
import { IPage } from "../../model/IPage";
import { GameDetailsComponent } from "./game-details/game-details.component";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { MatIconButton } from "@angular/material/button";
import { MatInput } from "@angular/material/input";
import { MatFormField, MatLabel } from "@angular/material/form-field";
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
    MatInput,
    FormField,
    MatIconButton,
    MatTooltip,
    MatIcon,
    GameDetailsComponent,
    MatPaginator
  ]
})
export class SteamWidgetComponent {
  public readonly playerData = signal<IPlayerDataResponse | undefined>(undefined);
  public readonly ownedGamesDisplay = computed<IGameInfoDisplay[]>(() =>
    this.ownedGames().map((game) => this.gameInfoResponseToGameInfoDisplay(game))
  );
  public readonly isPlayerDataLoaded = signal(false);
  public readonly areGamesLoaded = signal(false);

  public readonly gameCount = signal(0);
  public readonly pageSize = 25;
  public readonly pageSizeOptions = [this.pageSize];
  public readonly pageNumber = signal(0);

  public readonly config = signal({ steamUserId: injectWidgetData("steamUserId", "") });
  public readonly configForm = form(this.config, (path) => requiredText(path.steamUserId));
  public readonly searchQuery = signal("");
  public readonly searchForm = form(this.searchQuery);

  public readonly isFormValid = computed(() => this.configForm().valid());

  private readonly ownedGames = signal<IGameInfoResponse[]>([]);

  private readonly ERROR_GETTING_PLAYER_DATA =
    "Erreur lors de la récupération de vos informations Steam.";
  private readonly ERROR_GETTING_OWNED_GAMES =
    "Erreur lors de la récupération de la liste des jeux.";

  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly steamWidgetService = inject(SteamWidgetService);

  public constructor() {
    toObservable(this.searchQuery)
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((searchValue) => {
        const { steamUserId } = this.config();
        if (steamUserId) {
          this.pageNumber.set(0);
          this.getOwnedGames(steamUserId, searchValue || undefined);
        }
      });
  }

  public refreshWidget(): void {
    const { steamUserId } = this.config();
    if (steamUserId) {
      this.getPlayerData(steamUserId);
      this.getOwnedGames(steamUserId, this.searchQuery() || undefined, this.pageNumber());
    }
  }

  public getPlayerData(steamUserId: string): void {
    this.isPlayerDataLoaded.set(false);
    this.steamWidgetService.getPlayerData(steamUserId).subscribe({
      next: (response: IPlayerDataResponse[]) => {
        this.playerData.set(response[0]);
        this.isPlayerDataLoaded.set(true);
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_GETTING_PLAYER_DATA)
    });
  }

  public onPageChanged(event: PageEvent): void {
    const { steamUserId } = this.config();
    if (steamUserId) {
      this.pageNumber.set(event.pageIndex);
      this.getOwnedGames(steamUserId, this.searchQuery() || undefined, this.pageNumber());
    }
  }

  public resetForm(): void {
    this.searchQuery.set("");
  }

  public getWidgetData(): { steamUserId: string } | undefined {
    return this.isFormValid() ? this.config() : undefined;
  }

  private getOwnedGames(steamUserId: string, search?: string, pageNumber?: number): void {
    this.areGamesLoaded.set(false);
    this.steamWidgetService.getOwnedGames(steamUserId, search, pageNumber).subscribe({
      next: (response: IPage<IGameInfoResponse>) => {
        this.gameCount.set(response.totalElements);
        this.ownedGames.set(response.content);
        this.areGamesLoaded.set(true);
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_GETTING_OWNED_GAMES)
    });
  }

  private gameInfoResponseToGameInfoDisplay(gameInfoResponse: IGameInfoResponse): IGameInfoDisplay {
    const appIdLink = this.steamWidgetService.STEAM_COMMUNITY_URL + gameInfoResponse.appid;
    const playerAchievementUrl = `${this.playerData()?.profileurl}stats/${gameInfoResponse.appid}/achievements/`;
    const gameImgSrc = `${this.steamWidgetService.STEAM_IMAGE_URL}${gameInfoResponse.appid}/${gameInfoResponse.imgIconUrl}.jpg`;
    return { ...gameInfoResponse, appIdLink, playerAchievementUrl, gameImgSrc };
  }
}

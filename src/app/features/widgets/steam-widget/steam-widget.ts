import { NgOptimizedImage } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, DestroyRef, inject, linkedSignal, signal } from "@angular/core";
import { rxResource, takeUntilDestroyed, toObservable, toSignal } from "@angular/core/rxjs-interop";
import { form, FormField } from "@angular/forms/signals";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { catchError, debounceTime, distinctUntilChanged, map, of } from "rxjs";

import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { requiredText } from "@shared/forms/form-validators";
import { Widget } from "@widgets/widget/widget";
import { injectWidgetData } from "@widgets/widget-tokens";
import { Achievement, GameInfoDisplay, PlayerDataResponse, toGameInfoDisplay } from "./steam";
import { SteamWidgetService } from "./steam-widget-service";
import { SteamWidgetView } from "./steam-widget-view/steam-widget-view";

@Component({
  selector: "dash-steam-widget",
  templateUrl: "./steam-widget.html",
  styleUrl: "./steam-widget.scss",
  imports: [NgOptimizedImage, Widget, MatFormField, MatLabel, MatInput, FormField, SteamWidgetView]
})
export class SteamWidget {
  protected readonly labels = {
    steamUser: "Utilisateur Steam",
    enterSteamUserId: "Saisissez l'ID utilisateur du joueur Steam"
  };
  private readonly ERROR_MESSAGES = {
    gettingPlayerData: "Erreur lors de la récupération de vos informations Steam.",
    gettingOwnedGames: "Erreur lors de la récupération de la liste des jeux.",
    gettingAchievementsData: "Erreur lors de la récupération des succès."
  };

  public readonly config = signal({ steamUserId: injectWidgetData("steamUserId", "") });
  public readonly configForm = form(this.config, (path) => requiredText(path.steamUserId));
  public readonly searchQuery = signal("");
  // A new object on each refresh, so that the resources reload even if the user is unchanged
  private readonly refreshedSteamUser = signal<{ steamUserId: string } | undefined>(undefined);
  // Unchanged by a refresh of the same user
  private readonly refreshedSteamUserId = computed(() => this.refreshedSteamUser()?.steamUserId);
  // Back to the first page when the search or the Steam user changes
  public readonly pageNumber = linkedSignal({
    source: () => [this.debouncedSearchQuery(), this.refreshedSteamUserId()],
    computation: () => 0
  });

  /** Player of the Steam user saved on the last refresh, reloaded on each refresh. */
  private readonly playerDataResource = rxResource({
    params: () => this.refreshedSteamUser(),
    stream: ({ params: { steamUserId } }) =>
      this.steamWidgetService.getPlayerData(steamUserId).pipe(
        map((response: PlayerDataResponse[]) => response.at(0)),
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.gettingPlayerData);
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
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.gettingOwnedGames);
          return of(undefined);
        })
      )
  });

  public readonly playerData = this.playerDataResource.value;
  // True while a page of games is loading, until the response or the error is received
  public readonly isOwnedGamesLoading = this.ownedGamesResource.isLoading;
  public readonly gameCount = computed(() => this.ownedGamesResource.value()?.totalElements ?? 0);
  public readonly ownedGamesDisplay = computed<GameInfoDisplay[]>(() =>
    (this.ownedGamesResource.value()?.content ?? []).map((game) =>
      toGameInfoDisplay(game, this.playerData()?.profileurl)
    )
  );
  // The links to the achievements need the profile of the player
  public readonly isGamesListDisplayed = computed(
    () => !!this.config().steamUserId && !!this.playerData()
  );

  /** Achievements already loaded, by appid of their game, cleared on each refresh. */
  public readonly achievementsByAppId = linkedSignal<
    unknown,
    Readonly<Record<string, Achievement[]>>
  >({
    source: () => this.refreshedSteamUser(),
    computation: () => ({})
  });
  /** Appids of the games whose achievements are loading, cleared on each refresh. */
  public readonly loadingAchievementsAppIds = linkedSignal<unknown, ReadonlySet<string>>({
    source: () => this.refreshedSteamUser(),
    computation: () => new Set<string>()
  });
  public readonly isFormValid = computed(() => this.configForm().valid());
  public readonly widgetData = computed(() => (this.isFormValid() ? this.config() : undefined));
  private readonly debouncedSearchQuery = toSignal(
    toObservable(this.searchQuery).pipe(debounceTime(500), distinctUntilChanged()),
    { initialValue: "" }
  );

  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly steamWidgetService = inject(SteamWidgetService);
  private readonly destroyRef = inject(DestroyRef);

  /** Restores the configuration of the last refresh when the edition is cancelled. */
  public restoreSavedConfig(): void {
    const refreshed = this.refreshedSteamUser();
    if (refreshed) {
      this.config.set({ steamUserId: refreshed.steamUserId });
    }
  }

  public refreshWidget(): void {
    const { steamUserId } = this.config();
    if (steamUserId) {
      this.refreshedSteamUser.set({ steamUserId });
    }
  }

  public onPageChanged(pageIndex: number): void {
    if (this.refreshedSteamUser()) {
      this.pageNumber.set(pageIndex);
    }
  }

  public onSearchChanged(searchQuery: string): void {
    this.searchQuery.set(searchQuery);
  }

  public resetSearch(): void {
    this.searchQuery.set("");
  }

  /** Loads the achievements of a game, unless they are already loaded or loading. */
  public loadAchievements(appId: string): void {
    const refreshedSteamUser = this.refreshedSteamUser();
    if (
      !refreshedSteamUser ||
      appId in this.achievementsByAppId() ||
      this.loadingAchievementsAppIds().has(appId)
    ) {
      return;
    }
    this.loadingAchievementsAppIds.update((appIds) => new Set(appIds).add(appId));
    this.steamWidgetService
      .getAchievementList(refreshedSteamUser.steamUserId, appId)
      .pipe(
        map((response) => response.playerstats?.achievements ?? []),
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.gettingAchievementsData);
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((achievements) => {
        // Ignored if the widget has been refreshed in the meantime
        if (this.refreshedSteamUser() === refreshedSteamUser) {
          this.achievementsByAppId.update((achievementsByAppId) => ({
            ...achievementsByAppId,
            [appId]: achievements
          }));
          this.loadingAchievementsAppIds.update(
            (appIds) => new Set([...appIds].filter((loadingAppId) => loadingAppId !== appId))
          );
        }
      });
  }
}

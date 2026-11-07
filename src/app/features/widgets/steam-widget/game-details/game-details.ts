import { NgOptimizedImage } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, input, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import {
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatProgressBar } from "@angular/material/progress-bar";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { catchError, map, of } from "rxjs";
import { Achievement, GameInfoDisplay } from "../steam";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { SteamWidgetService } from "../steam-widget-service";

@Component({
  selector: "dash-game-details",
  templateUrl: "./game-details.html",
  styleUrl: "./game-details.scss",
  imports: [
    NgOptimizedImage,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelContent,
    MatButton,
    MatIcon,
    MatProgressBar,
    MatProgressSpinner
  ]
})
export class GameDetails {
  protected readonly labels = {
    gameIcon: "game icon",
    percent: "%",
    achievements: "Succès :",
    completedAchievements: "Succès complétés :",
    communityHub: "Community hub",
    noAchievements: "Aucun succès pour ce jeu."
  };

  private readonly ERROR_MESSAGES = {
    gettingAchievementsData: "Erreur lors de la récupération des succès."
  };

  public readonly gameInfo = input.required<GameInfoDisplay>();
  public readonly steamUserId = input.required<string>();

  private readonly isPanelOpened = signal(false);

  /** Achievements of the player for this game, loaded once the panel has been opened. */
  public readonly achievementsResource = rxResource({
    params: () =>
      this.isPanelOpened()
        ? { steamUserId: this.steamUserId(), appId: this.gameInfo().appid }
        : undefined,
    stream: ({ params: { steamUserId, appId } }) =>
      this.steamWidgetService.getAchievementList(steamUserId, appId).pipe(
        map((response) => response.playerstats?.achievements ?? []),
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.gettingAchievementsData);
          return of([]);
        })
      ),
    defaultValue: [] as Achievement[]
  });

  public readonly achievements = this.achievementsResource.value;
  private readonly completedAchievements = computed(() =>
    this.achievements().filter((achievement) => achievement.achieved === 1)
  );
  // Kept short so that the text stays on one line, without surrounding spaces
  public readonly completedCount = computed(() => this.completedAchievements().length);
  public readonly completionStatus = computed(() =>
    this.achievements().length
      ? Math.floor((this.completedAchievements().length / this.achievements().length) * 100)
      : undefined
  );

  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly steamWidgetService = inject(SteamWidgetService);

  public loadAchievementsData(): void {
    this.isPanelOpened.set(true);
  }
}

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
import { IAchievement, IGameInfoDisplay } from "../ISteam";
import { ErrorHandlerService } from "../../../services/error.handler.service";
import { SteamWidgetService } from "../steam.widget.service";

@Component({
  selector: "dash-game-details",
  templateUrl: "./game-details.component.html",
  styleUrl: "./game-details.component.scss",
  imports: [
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
export class GameDetailsComponent {
  public readonly gameInfo = input.required<IGameInfoDisplay>();
  public readonly steamUserId = input.required<string>();
  public readonly profileUrl = input.required<string>();

  /** Achievements of the player for this game, loaded once the panel has been opened. */
  public readonly achievementsResource = rxResource({
    params: () =>
      this.isPanelOpened()
        ? { steamUserId: this.steamUserId(), appId: this.gameInfo().appid }
        : undefined,
    stream: ({ params: { steamUserId, appId } }) =>
      this.steamWidgetService.getAchievementList(steamUserId, appId).pipe(
        map((response) => response.playerstats.achievements ?? []),
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_ACHIEVEMENTS_DATA);
          return of([]);
        })
      ),
    defaultValue: [] as IAchievement[]
  });

  public readonly achievements = this.achievementsResource.value;
  public readonly completedAchievements = computed(() =>
    this.achievements().filter((achievement) => achievement.achieved === 1)
  );
  public readonly completionStatus = computed(() =>
    this.achievements().length
      ? Math.floor((this.completedAchievements().length / this.achievements().length) * 100)
      : undefined
  );

  private readonly isPanelOpened = signal(false);

  private readonly ERROR_GETTING_ACHIEVEMENTS_DATA = "Erreur lors de la récupération des succès.";
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly steamWidgetService = inject(SteamWidgetService);

  public loadAchievementsData(): void {
    this.isPanelOpened.set(true);
  }
}

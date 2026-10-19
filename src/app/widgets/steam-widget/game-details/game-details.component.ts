import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, input, signal } from "@angular/core";
import {
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
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
    MatProgressSpinner
  ]
})
export class GameDetailsComponent {
  public readonly gameInfo = input.required<IGameInfoDisplay>();
  public readonly steamUserId = input.required<string>();
  public readonly profileUrl = input.required<string>();

  public readonly achievements = signal<IAchievement[]>([]);
  public readonly completedAchievements = computed(() =>
    this.achievements().filter((achievement) => achievement.achieved === 1)
  );
  public readonly completionStatus = computed(() =>
    this.achievements().length
      ? Math.floor((this.completedAchievements().length / this.achievements().length) * 100)
      : undefined
  );

  private readonly ERROR_GETTING_ACHIEVEMENTS_DATA = "Erreur lors de la récupération des succès.";
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly steamWidgetService = inject(SteamWidgetService);

  public loadAchievementsData(steamUserId: string, gameInfo: IGameInfoDisplay): void {
    this.steamWidgetService.getAchievementList(steamUserId, gameInfo.appid).subscribe({
      next: (response) => {
        if (response.playerstats.achievements) {
          this.achievements.set(response.playerstats.achievements);
        }
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_GETTING_ACHIEVEMENTS_DATA)
    });
  }
}

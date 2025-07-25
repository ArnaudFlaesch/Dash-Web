import { HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  signal,
  WritableSignal
} from "@angular/core";
import {
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { IAchievement, IAchievementResponse, IGameInfoDisplay } from "../ISteam";
import { ErrorHandlerService } from "../../../services/error.handler.service";
import { SteamWidgetService } from "../steam.widget.service";

@Component({
  selector: "dash-game-details",
  templateUrl: "./game-details.component.html",
  styleUrls: ["./game-details.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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

  public readonly achievements: WritableSignal<IAchievement[]> = signal([]);
  public readonly completedAchievements: WritableSignal<IAchievement[]> = signal([]);
  public readonly completionStatus = signal<number | undefined>(undefined);

  private readonly ERROR_GETTING_ACHIEVEMENTS_DATA = "Erreur lors de la récupération des succès.";
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly steamWidgetService = inject(SteamWidgetService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  public loadAchievementsData(steamUserId: string, gameInfo: IGameInfoDisplay): void {
    this.steamWidgetService.getAchievementList(steamUserId, gameInfo.appid).subscribe({
      next: (response: unknown) => {
        const achievementResponse = response as IAchievementResponse;
        if (achievementResponse.playerstats.achievements) {
          this.achievements.set(achievementResponse.playerstats.achievements);
          this.completedAchievements.set(
            achievementResponse.playerstats.achievements.filter(
              (achievement: IAchievement) => achievement.achieved === 1
            )
          );
          this.completionStatus.set(
            Math.floor((this.completedAchievements().length / this.achievements().length) * 100)
          );
        }
        this.changeDetectorRef.detectChanges();
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_GETTING_ACHIEVEMENTS_DATA)
    });
  }
}

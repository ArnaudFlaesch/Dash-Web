import { HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  inject,
  input
} from "@angular/core";
import {
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { IAchievement, IAchievementResponse, IGameInfoDisplay } from "../ISteam";
import { ErrorHandlerService } from "./../../../services/error.handler.service";
import { SteamWidgetService } from "./../steam.widget.service";

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
  @Input() public gameInfo: IGameInfoDisplay | undefined;
  @Input() public steamUserId: string | undefined;
  public readonly profileUrl = input<string>();

  public achievements: IAchievement[] = [];
  public completedAchievements: IAchievement[] = [];
  public completionStatus: number | undefined;

  private readonly ERROR_GETTING_ACHIEVEMENTS_DATA = "Erreur lors de la récupération des succès.";

  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly steamWidgetService = inject(SteamWidgetService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  public loadAchievementsData(steamUserId: string, gameInfo: IGameInfoDisplay): void {
    this.steamWidgetService.getAchievementList(steamUserId, gameInfo.appid).subscribe({
      next: (response: unknown) => {
        const achievementResponse = response as IAchievementResponse;
        if (achievementResponse.playerstats.achievements) {
          this.achievements = achievementResponse.playerstats.achievements;
          this.completedAchievements = achievementResponse.playerstats.achievements.filter(
            (achievement: IAchievement) => achievement.achieved === 1
          );
          this.completionStatus = Math.floor(
            (this.completedAchievements.length / this.achievements.length) * 100
          );
        }
        this.changeDetectorRef.detectChanges();
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_GETTING_ACHIEVEMENTS_DATA)
    });
  }
}

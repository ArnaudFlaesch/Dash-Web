import { ErrorHandlerService } from './../../../services/error.handler.service';
import { SteamWidgetService } from './../steam.widget.service';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { IAchievement, IAchievementResponse, IGameInfoDisplay } from '../ISteam';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
  MatExpansionPanelContent
} from '@angular/material/expansion';

@Component({
  selector: 'dash-game-details',
  templateUrl: './game-details.component.html',
  styleUrls: ['./game-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
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
  @Input()
  public gameInfo: IGameInfoDisplay | undefined;

  @Input()
  public steamUserId: string | undefined;

  @Input()
  public profileUrl: string | undefined;

  public achievements: IAchievement[] = [];
  public completedAchievements: IAchievement[] = [];
  public completionStatus: number | undefined;

  private ERROR_GETTING_ACHIEVEMENTS_DATA = 'Erreur lors de la récupération des succès.';

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private steamWidgetService: SteamWidgetService
  ) {}

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
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_GETTING_ACHIEVEMENTS_DATA)
    });
  }
}

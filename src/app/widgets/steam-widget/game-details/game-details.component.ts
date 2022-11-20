import { ErrorHandlerService } from './../../../services/error.handler.service';
import { SteamWidgetService } from './../steam.widget.service';
import { Component, Input, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { IGameInfo, IAchievement, IAchievementResponse } from '../ISteam';

@Component({
  selector: 'app-game-details',
  templateUrl: './game-details.component.html',
  styleUrls: ['./game-details.component.scss']
})
export class GameDetailsComponent implements OnInit {
  @Input()
  public gameInfo: IGameInfo | undefined;

  @Input()
  public steamUserId: string | undefined;

  public achievements: IAchievement[] = [];
  public completedAchievements: IAchievement[] = [];

  private ERROR_GETTING_ACHIEVEMENTS_DATA =
    'Erreur lors de la récupération des succès.';

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private steamWidgetService: SteamWidgetService
  ) {}

  ngOnInit(): void {
    if (this.steamUserId && this.gameInfo) {
      this.loadAchievementsData(this.steamUserId, this.gameInfo);
    }
  }

  public loadAchievementsData(steamUserId: string, gameInfo: IGameInfo): void {
    this.steamWidgetService
      .getAchievementList(steamUserId, gameInfo.appid)
      .subscribe({
        next: (response: unknown) => {
          const achievementResponse = response as IAchievementResponse;
          if (achievementResponse.playerstats.achievements) {
            this.achievements = achievementResponse.playerstats.achievements;
            this.completedAchievements =
              achievementResponse.playerstats.achievements.filter(
                (achievement: IAchievement) => achievement.achieved === 1
              );
          }
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(
            error.message,
            this.ERROR_GETTING_ACHIEVEMENTS_DATA
          )
      });
  }

  public getCompletionStatus(): number {
    return Math.round(
      (this.completedAchievements.length / this.achievements.length) * 100
    );
  }

  public getAppIdLink(): string {
    return `${this.steamWidgetService.STEAM_COMMUNITY_URL}${this.gameInfo?.appid}`;
  }
}

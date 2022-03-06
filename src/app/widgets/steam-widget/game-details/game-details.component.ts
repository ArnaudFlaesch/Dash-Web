import { ErrorHandlerService } from './../../../services/error.handler.service';
import { SteamWidgetService } from './../steam.widget.service';
import { IGameInfo } from './../IGameInfo';
import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';

interface IAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
}

interface IAchievementResponse {
  playerstats: {
    achievements: IAchievement[];
  };
}

@Component({
  selector: 'app-game-details',
  templateUrl: './game-details.component.html',
  styleUrls: ['./game-details.component.scss']
})
export class GameDetailsComponent implements OnInit {
  @Input()
  public gameInfo: IGameInfo | undefined;

  public achievements: IAchievement[] = [];
  public completedAchievements: IAchievement[] = [];

  private ERROR_GETTING_ACHIEVEMENTS_DATA = 'Erreur lors de la récupération des succès.';

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private steamWidgetService: SteamWidgetService
  ) {}

  ngOnInit(): void {
    if (this.gameInfo) {
      this.steamWidgetService.getAchievementList(this.gameInfo.appid).subscribe({
        next: (response: unknown) => {
          const achievementResponse = response as IAchievementResponse;
          if (achievementResponse.playerstats.achievements) {
            this.achievements = achievementResponse.playerstats.achievements;
            this.completedAchievements = achievementResponse.playerstats.achievements.filter(
              (achievement: IAchievement) => achievement.achieved === 1
            );
          }
        },
        error: (error: Error) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_GETTING_ACHIEVEMENTS_DATA)
      });
    }
  }

  public getCompletionStatus = () =>
    Math.round((this.completedAchievements.length / this.achievements.length) * 100);

  public getAppIdLink = () =>
    `${this.steamWidgetService.STEAM_COMMUNITY_URL}${this.gameInfo?.appid}`;

  public getImgLogoUrl = () =>
    `${this.steamWidgetService.STEAM_IMAGE_URL}${this.gameInfo?.appid}/${this.gameInfo?.img_logo_url}.jpg`;
}

import { SteamWidgetService } from './../steam.widget.service';
import { IGameInfo } from './../IGameInfo';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

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
export class GameDetailsComponent implements OnChanges {
  @Input()
  public gameInfo: IGameInfo | undefined;

  public achievements: IAchievement[] = [];
  public completedAchievements: IAchievement[] = [];

  constructor(private steamWidgetService: SteamWidgetService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.gameInfo?.appid) {
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
        error: (error: Error) => console.error(error.message)
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

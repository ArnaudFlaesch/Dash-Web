import { environment } from './../../../../environments/environment';
import { IGameInfo } from './../IGameInfo';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { ErrorHandlerService } from '../../../services/error.handler.service';
import { SteamWidgetService } from '../steam.widget.service';
import { GameDetailsComponent } from './game-details.component';

describe('GameDetailsComponent', () => {
  let spectator: Spectator<GameDetailsComponent>;
  let steamWidgetService: SpectatorHttp<SteamWidgetService>;

  const createComponent = createComponentFactory({
    component: GameDetailsComponent,
    imports: [MatSnackBarModule],
    providers: [SteamWidgetService, ErrorHandlerService],
    schemas: [NO_ERRORS_SCHEMA]
  });
  const createHttp = createHttpFactory(SteamWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    steamWidgetService = createHttp();
  });

  it('should create', () => {
    const appId = '1337';
    const achievementsData = {
      playerstats: {
        steamID: '76561198046131373',
        gameName: 'Half-Life 2: Episode Two',
        achievements: [
          {
            apiname: 'EP2_KILL_POISONANTLION',
            achieved: 1,
            unlocktime: 1352488322
          },
          {
            apiname: 'EP2_KILL_ALLGRUBS',
            achieved: 0,
            unlocktime: 0
          },
          {
            apiname: 'EP2_BREAK_ALLWEBS',
            achieved: 1,
            unlocktime: 1446892109
          },
          {
            apiname: 'EP2_BEAT_ANTLIONINVASION',
            achieved: 1,
            unlocktime: 1352489474
          },
          {
            apiname: 'EP2_BEAT_ANTLIONGUARDS',
            achieved: 1,
            unlocktime: 1352492128
          }
        ],
        success: true
      }
    };
    expect(spectator.component.achievements).toEqual([]);
    expect(spectator.component.completedAchievements).toEqual([]);
    spectator.component.gameInfo = { appid: appId, name: 'Super Game' } as IGameInfo;
    spectator.component.loadAchievementsData(spectator.component?.gameInfo);
    const getAchievementsRequest = steamWidgetService.expectOne(
      environment.backend_url + '/steamWidget/achievementList?appId=' + appId,
      HttpMethod.GET
    );
    getAchievementsRequest.flush(achievementsData);
    expect(spectator.component.achievements.length).toEqual(5);
    expect(spectator.component.completedAchievements.length).toEqual(4);
    expect(spectator.component.getCompletionStatus()).toEqual(80);
  });
});

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpMethod, createSpyObject } from '@ngneat/spectator/jest';

import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ErrorHandlerService } from '../../../services/error.handler.service';
import { IGameInfoDisplay } from '../ISteam';
import { SteamWidgetService } from '../steam.widget.service';
import { environment } from './../../../../environments/environment';
import { GameDetailsComponent } from './game-details.component';

describe('GameDetailsComponent', () => {
  let component: GameDetailsComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatSnackBarModule],
      providers: [SteamWidgetService, ErrorHandlerService]
    }).compileComponents();

    const fixture = TestBed.createComponent(GameDetailsComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('Normal cases', () => {
    it('should create', () => {
      const steamUserId = '1237';
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
      expect(component.achievements).toEqual([]);
      expect(component.completedAchievements).toEqual([]);
      component.gameInfo = {
        appid: appId,
        name: 'Super Game'
      } as IGameInfoDisplay;

      component.loadAchievementsData(steamUserId, component.gameInfo);
      const getAchievementsRequest = httpTestingController.expectOne(
        environment.backend_url +
          '/steamWidget/achievementList?steamUserId=' +
          steamUserId +
          '&appId=' +
          appId,
        HttpMethod.GET
      );
      getAchievementsRequest.flush(achievementsData);
      expect(component.achievements.length).toEqual(5);
      expect(component.completedAchievements.length).toEqual(4);
      expect(component.completionStatus).toEqual(80);
    });
  });

  describe('Error cases', () => {
    it('should display error messages', () => {
      const errorHandlerService = createSpyObject(ErrorHandlerService);

      const steamUserId = '1237';
      const appId = '1337';
      component.gameInfo = {
        appid: appId,
        name: 'Super Game'
      } as IGameInfoDisplay;
      component.loadAchievementsData(steamUserId, component.gameInfo);
      httpTestingController
        .expectOne(
          environment.backend_url +
            '/steamWidget/achievementList?steamUserId=' +
            steamUserId +
            '&appId=' +
            appId,
          HttpMethod.GET
        )
        .error(new ProgressEvent('Server error'));
      expect(errorHandlerService.handleError).toHaveBeenCalledTimes(1);
    });
  });
});

import { PageEvent } from '@angular/material/paginator';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { environment } from '../../../environments/environment';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { SteamWidgetComponent } from './steam-widget.component';
import { SteamWidgetService } from './steam.widget.service';
import { IGameInfo, IPlayerDataResponse } from './ISteam';

describe('SteamWidgetComponent', () => {
  let spectator: Spectator<SteamWidgetComponent>;
  let steamWidgetService: SpectatorHttp<SteamWidgetService>;

  const createComponent = createComponentFactory({
    component: SteamWidgetComponent,
    imports: [MatSnackBarModule],
    providers: [SteamWidgetService, ErrorHandlerService],
    schemas: [NO_ERRORS_SCHEMA]
  });
  const createHttp = createHttpFactory(SteamWidgetService);

  const playerData: IPlayerDataResponse[] = [
    {
      personaname: 'Nono',
      profileurl: 'https://steamcommunity.com/id/Nauno93/',
      avatar:
        'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/d1/d16c8dc08c0d3d71f7b7e47ba2b13e78418cd6d3.jpg'
    }
  ];
  const ownedGamesData = {
    gameCount: 10,
    games: [
      {
        appid: 220,
        name: 'Half-Life 2',
        playtimeForever: 2480,
        imgIconUrl: 'fcfb366051782b8ebf2aa297f3b746395858cb62',
        imgLogoUrl: 'e4ad9cf1b7dc8475c1118625daf9abd4bdcbcad0',
        hasCommunityVisibleStats: true,
        playtimeWindowsForever: 0,
        playtimeMacForever: 0,
        playtimeLinuxForever: 0
      },
      {
        appid: 340,
        name: 'Half-Life 2: Lost Coast',
        playtimeForever: 32,
        imgIconUrl: '795e85364189511f4990861b578084deef086cb1',
        imgLogoUrl: '867cce5c4f37d5ed4aeffb57c60e220ddffe4134',
        playtimeWindowsForever: 0,
        playtimeMacForever: 0,
        playtimeLinuxForever: 0
      },
      {
        appid: 280,
        name: 'Half-Life: Source',
        playtimeForever: 774,
        imgIconUrl: 'b4f572a6cc5a6a84ae84634c31414b9123d2f26b',
        imgLogoUrl: 'a612dd944b768e55389140298dcfda2165db8ced',
        playtimeWindowsForever: 0,
        playtimeMacForever: 0,
        playtimeLinuxForever: 0
      }
    ]
  };

  beforeEach(() => {
    spectator = createComponent();
    steamWidgetService = createHttp();
  });

  it('should create', () => {
    expect(spectator.component.playerData).toEqual(null);
    expect(spectator.component.ownedGames).toEqual([]);
    expect(spectator.component.isWidgetLoaded()).toEqual(false);
    const steamUserId = '1337';
    expect(spectator.component.isFormValid()).toEqual(false);
    spectator.component.steamUserId = steamUserId;
    expect(spectator.component.isFormValid()).toEqual(true);
    spectator.component.refreshWidget();

    const dataRequests = steamWidgetService.expectConcurrent([
      {
        url:
          environment.backend_url +
          `/steamWidget/playerData?steamUserId=${steamUserId}`,
        method: HttpMethod.GET
      },
      {
        url:
          environment.backend_url +
          `/steamWidget/ownedGames?steamUserId=${steamUserId}`,
        method: HttpMethod.GET
      }
    ]);

    steamWidgetService.flushAll(dataRequests, [playerData, ownedGamesData]);

    expect(spectator.component.isWidgetLoaded()).toEqual(true);
    expect(spectator.component.playerData?.personaname).toEqual(
      playerData[0].personaname
    );
    expect(spectator.component.ownedGames.length).toEqual(3);
  });

  it('Should load new data on page navigation', () => {
    expect(spectator.component.ownedGames).toEqual([]);
    expect(spectator.component.pageNumber).toEqual(0);
    const pageIndex = 2;
    const pageEvent = {
      pageIndex: pageIndex,
      pageSize: 25,
      length: 150
    } as PageEvent;
    spectator.component.onPageChanged(pageEvent);
    expect(spectator.component.pageNumber).toEqual(0);
    const steamUserId = '1337';
    spectator.component.steamUserId = steamUserId;
    spectator.component.ownedGames =
      ownedGamesData.games as unknown as IGameInfo[];
    spectator.component.onPageChanged(pageEvent);
    expect(spectator.component.pageNumber).toEqual(pageIndex);

    steamWidgetService.expectOne(
      environment.backend_url +
        `/steamWidget/ownedGames?steamUserId=${steamUserId}&pageNumber=${pageIndex}`,
      HttpMethod.GET
    );
  });

  it('Should get game icon link', () => {
    expect(spectator.component.getGameImgSrc('13', 'URL')).toEqual(
      'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/13/URL.jpg'
    );
  });
});

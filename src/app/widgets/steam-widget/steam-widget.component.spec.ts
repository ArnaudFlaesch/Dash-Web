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

  beforeEach(() => {
    spectator = createComponent();
    steamWidgetService = createHttp();
  });

  it('should create', () => {
    expect(spectator.component.playerData).toEqual(null);
    expect(spectator.component.ownedGames).toEqual([]);
    spectator.component.refreshWidget();

    const playerData = {
      response: {
        players: [
          {
            steamid: '76561198046131373',
            communityvisibilitystate: 3,
            profilestate: 1,
            personaname: 'Nono',
            profileurl: 'https://steamcommunity.com/id/Nauno93/',
            avatar:
              'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/d1/d16c8dc08c0d3d71f7b7e47ba2b13e78418cd6d3.jpg',
            avatarmedium:
              'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/d1/d16c8dc08c0d3d71f7b7e47ba2b13e78418cd6d3_medium.jpg',
            avatarfull:
              'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/d1/d16c8dc08c0d3d71f7b7e47ba2b13e78418cd6d3_full.jpg',
            avatarhash: 'd16c8dc08c0d3d71f7b7e47ba2b13e78418cd6d3',
            lastlogoff: 1621716524,
            personastate: 0,
            primaryclanid: '103582791433898853',
            timecreated: 1312033216,
            personastateflags: 0,
            loccountrycode: 'FR',
            locstatecode: 'A8',
            loccityid: 16153
          }
        ]
      }
    };

    const ownedGamesData = {
      response: {
        game_count: 10,
        games: [
          {
            appid: 220,
            name: 'Half-Life 2',
            playtime_forever: 2480,
            img_icon_url: 'fcfb366051782b8ebf2aa297f3b746395858cb62',
            img_logo_url: 'e4ad9cf1b7dc8475c1118625daf9abd4bdcbcad0',
            has_community_visible_stats: true,
            playtime_windows_forever: 0,
            playtime_mac_forever: 0,
            playtime_linux_forever: 0
          },
          {
            appid: 340,
            name: 'Half-Life 2: Lost Coast',
            playtime_forever: 32,
            img_icon_url: '795e85364189511f4990861b578084deef086cb1',
            img_logo_url: '867cce5c4f37d5ed4aeffb57c60e220ddffe4134',
            playtime_windows_forever: 0,
            playtime_mac_forever: 0,
            playtime_linux_forever: 0
          },
          {
            appid: 280,
            name: 'Half-Life: Source',
            playtime_forever: 774,
            img_icon_url: 'b4f572a6cc5a6a84ae84634c31414b9123d2f26b',
            img_logo_url: 'a612dd944b768e55389140298dcfda2165db8ced',
            playtime_windows_forever: 0,
            playtime_mac_forever: 0,
            playtime_linux_forever: 0
          }
        ]
      }
    };

    const dataRequests = steamWidgetService.expectConcurrent([
      {
        url: environment.backend_url + '/steamWidget/playerData',
        method: HttpMethod.GET
      },
      {
        url: environment.backend_url + '/steamWidget/ownedGames',
        method: HttpMethod.GET
      }
    ]);

    steamWidgetService.flushAll(dataRequests, [playerData, ownedGamesData]);

    expect(spectator.component.playerData?.personaname).toEqual(
      playerData.response.players[0].personaname
    );
    expect(spectator.component.ownedGames.length).toEqual(3);
  });
});

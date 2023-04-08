import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';

import { IPage } from '../../../app/model/IPage';
import { environment } from '../../../environments/environment';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { IGameInfoResponse, IPlayerDataResponse } from './ISteam';
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

  const playerData: IPlayerDataResponse[] = [
    {
      personaname: 'Nono',
      profileurl: 'https://steamcommunity.com/id/Nauno93/',
      avatar:
        'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/d1/d16c8dc08c0d3d71f7b7e47ba2b13e78418cd6d3.jpg'
    }
  ];
  const ownedGamesData: IPage<IGameInfoResponse> = {
    totalElements: 10,
    content: [
      {
        appid: '220',
        name: 'Half-Life 2',
        imgIconUrl: 'fcfb366051782b8ebf2aa297f3b746395858cb62',
        imgLogoUrl: 'e4ad9cf1b7dc8475c1118625daf9abd4bdcbcad0'
      },
      {
        appid: '340',
        name: 'Half-Life 2: Lost Coast',
        imgIconUrl: '795e85364189511f4990861b578084deef086cb1',
        imgLogoUrl: '867cce5c4f37d5ed4aeffb57c60e220ddffe4134'
      },
      {
        appid: '280',
        name: 'Half-Life: Source',
        imgIconUrl: 'b4f572a6cc5a6a84ae84634c31414b9123d2f26b',
        imgLogoUrl: 'a612dd944b768e55389140298dcfda2165db8ced'
      }
    ],
    totalPages: 1,
    last: true,
    size: 3,
    number: 0
  };

  beforeEach(() => {
    spectator = createComponent();
    steamWidgetService = createHttp();
  });

  it('should create', () => {
    expect(spectator.component.playerData).toEqual(undefined);
    expect(spectator.component.ownedGamesDisplay).toEqual([]);
    const steamUserId = '1337';
    expect(spectator.component.isFormValid()).toEqual(false);
    spectator.component.steamUserId = steamUserId;
    expect(spectator.component.isFormValid()).toEqual(true);
    spectator.component.refreshWidget();

    const dataRequests = steamWidgetService.expectConcurrent([
      {
        url: `${environment.backend_url}/steamWidget/playerData?steamUserId=${steamUserId}`,
        method: HttpMethod.GET
      },
      {
        url: `${environment.backend_url}/steamWidget/ownedGames?steamUserId=${steamUserId}`,
        method: HttpMethod.GET
      }
    ]);

    steamWidgetService.flushAll(dataRequests, [playerData, ownedGamesData]);

    expect(spectator.component.playerData?.personaname).toEqual(playerData[0].personaname);
    expect(spectator.component.ownedGamesDisplay.length).toEqual(3);
  });

  it('Should load new data on page navigation', () => {
    expect(spectator.component.ownedGamesDisplay).toEqual([]);
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
    const searchValue = 'Mario';
    spectator.component.searchFormControl.setValue(searchValue);
    spectator.component.onPageChanged(pageEvent);
    expect(spectator.component.pageNumber).toEqual(pageIndex);

    steamWidgetService.expectOne(
      environment.backend_url +
        `/steamWidget/ownedGames?steamUserId=${steamUserId}&search=${searchValue}&pageNumber=${pageIndex}`,
      HttpMethod.GET
    );

    spectator.component.resetForm();
    expect(spectator.component.searchFormControl.value).toEqual(null);
  });

  it('Should get widget data and check form', () => {
    expect(spectator.component.getWidgetData()).toEqual(undefined);
    expect(spectator.component.isFormValid()).toEqual(false);
    const steamUserId = '1337';
    spectator.component.steamUserId = steamUserId;
    expect(spectator.component.getWidgetData()).toEqual({
      steamUserId: steamUserId
    });
    expect(spectator.component.isFormValid()).toEqual(true);
  });
});

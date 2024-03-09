import { PageEvent } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpMethod } from '@ngneat/spectator/jest';

import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { IPage } from '../../../app/model/IPage';
import { environment } from '../../../environments/environment';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { WidgetService } from '../../services/widget.service/widget.service';
import { IGameInfoResponse, IPlayerDataResponse } from './ISteam';
import { SteamWidgetComponent } from './steam-widget.component';
import { SteamWidgetService } from './steam.widget.service';

describe('SteamWidgetComponent', () => {
  let component: SteamWidgetComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatSnackBarModule],
      providers: [SteamWidgetService, WidgetService, ErrorHandlerService]
    }).compileComponents();

    const fixture = TestBed.createComponent(SteamWidgetComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

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

  it('should create', () => {
    expect(component.playerData).toEqual(undefined);
    expect(component.ownedGamesDisplay).toEqual([]);
    const steamUserId = '1337';
    expect(component.isFormValid()).toEqual(false);
    component.steamUserId = steamUserId;
    expect(component.isFormValid()).toEqual(true);
    component.refreshWidget();

    const dataRequests = httpTestingController.expectConcurrent([
      {
        url: `${environment.backend_url}/steamWidget/playerData?steamUserId=${steamUserId}`,
        method: HttpMethod.GET
      },
      {
        url: `${environment.backend_url}/steamWidget/ownedGames?steamUserId=${steamUserId}`,
        method: HttpMethod.GET
      }
    ]);

    httpTestingController.flushAll(dataRequests, [playerData, ownedGamesData]);

    expect(component.playerData?.personaname).toEqual(playerData[0].personaname);
    expect(component.ownedGamesDisplay.length).toEqual(3);
  });

  it('Should load new data on page navigation', () => {
    expect(component.ownedGamesDisplay).toEqual([]);
    expect(component.pageNumber).toEqual(0);
    const pageIndex = 2;
    const pageEvent = {
      pageIndex: pageIndex,
      pageSize: 25,
      length: 150
    } as PageEvent;
    component.onPageChanged(pageEvent);
    expect(component.pageNumber).toEqual(0);
    const steamUserId = '1337';
    component.steamUserId = steamUserId;
    const searchValue = 'Mario';
    component.searchFormControl.setValue(searchValue);
    component.onPageChanged(pageEvent);
    expect(component.pageNumber).toEqual(pageIndex);

    httpTestingController.expectOne(
      environment.backend_url +
        `/steamWidget/ownedGames?steamUserId=${steamUserId}&search=${searchValue}&pageNumber=${pageIndex}`,
      HttpMethod.GET
    );

    component.resetForm();
    expect(component.searchFormControl.value).toEqual(null);
  });

  it('Should get widget data and check form', () => {
    expect(component.getWidgetData()).toEqual(undefined);
    expect(component.isFormValid()).toEqual(false);
    const steamUserId = '1337';
    component.steamUserId = steamUserId;
    expect(component.getWidgetData()).toEqual({
      steamUserId: steamUserId
    });
    expect(component.isFormValid()).toEqual(true);
  });
});

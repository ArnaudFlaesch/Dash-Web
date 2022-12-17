import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ErrorHandlerService } from './../../services/error.handler.service';
import {
  IGameInfoDisplay,
  IGameInfoResponse,
  IOwnedGamesResponse,
  IPlayerDataResponse
} from './ISteam';
import { SteamWidgetService } from './steam.widget.service';

@Component({
  selector: 'app-steam-widget',
  templateUrl: './steam-widget.component.html',
  styleUrls: ['./steam-widget.component.scss']
})
export class SteamWidgetComponent implements OnInit {
  public playerData: IPlayerDataResponse | undefined;
  public gameCount = 0;
  public ownedGamesDisplay: IGameInfoDisplay[] = [];

  public pageSize = 25;
  public pageSizeOptions = [25];
  public pageNumber = 0;

  public steamUserId: string | undefined;

  public searchFormControl = new FormControl('');

  private ownedGames: IGameInfoResponse[] = [];

  private ERROR_GETTING_PLAYER_DATA = 'Erreur lors de la récupération de vos informations Steam.';
  private ERROR_GETTING_OWNED_GAMES = 'Erreur lors de la récupération de la liste des jeux.';

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private steamWidgetService: SteamWidgetService
  ) {}

  public ngOnInit(): void {
    this.searchFormControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchValue) => {
        if (this.steamUserId) {
          this.pageNumber = 0;
          this.getOwnedGames(this.steamUserId, searchValue || undefined);
        }
      });
  }

  public refreshWidget(): void {
    if (this.steamUserId) {
      const steamUserId = this.steamUserId;
      this.getPlayerData(steamUserId);
      this.getOwnedGames(
        this.steamUserId,
        this.searchFormControl.value || undefined,
        this.pageNumber
      );
    }
  }

  public getPlayerData(steamUserId: string): void {
    this.steamWidgetService.getPlayerData(steamUserId).subscribe({
      next: (response: IPlayerDataResponse[]) => (this.playerData = response[0]),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error.message, this.ERROR_GETTING_PLAYER_DATA)
    });
  }

  public getOwnedGames(steamUserId: string, search?: string, pageNumber?: number): void {
    this.steamWidgetService.getOwnedGames(steamUserId, search, pageNumber).subscribe({
      next: (response: IOwnedGamesResponse) => {
        this.gameCount = response.gameCount;
        this.ownedGames = response.games;
        this.ownedGamesDisplay = this.ownedGames.map((game) =>
          this.gameInfoResponseToGameInfoDisplay(game)
        );
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error.message, this.ERROR_GETTING_OWNED_GAMES)
    });
  }

  public onPageChanged(event: PageEvent): void {
    if (this.steamUserId) {
      this.pageNumber = event.pageIndex;
      this.getOwnedGames(
        this.steamUserId,
        this.searchFormControl.value || undefined,
        this.pageNumber
      );
    }
  }

  public getWidgetData():
    | {
        steamUserId: string;
      }
    | undefined {
    return this.steamUserId ? { steamUserId: this.steamUserId } : undefined;
  }

  public isFormValid(): boolean {
    return !!this.steamUserId && this.steamUserId?.length > 0;
  }

  public isWidgetLoaded(): boolean {
    return this.steamUserId != undefined && this.playerData != null;
  }

  private gameInfoResponseToGameInfoDisplay(gameInfoResponse: IGameInfoResponse): IGameInfoDisplay {
    const appIdLink = this.steamWidgetService.STEAM_COMMUNITY_URL + gameInfoResponse.appid;
    const playerAchievementUrl = `${this.playerData?.profileurl}stats/${gameInfoResponse?.appid}/achievements/`;
    const gameImgSrc = `${this.steamWidgetService.STEAM_IMAGE_URL}${gameInfoResponse.appid}/${gameInfoResponse.imgIconUrl}.jpg`;
    return {
      ...gameInfoResponse,
      appIdLink: appIdLink,
      playerAchievementUrl: playerAchievementUrl,
      gameImgSrc: gameImgSrc
    };
  }
}

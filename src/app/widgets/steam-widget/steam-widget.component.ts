import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ErrorHandlerService } from './../../services/error.handler.service';
import { IGameInfo, IOwnedGamesResponse, IPlayerDataResponse } from './ISteam';
import { SteamWidgetService } from './steam.widget.service';

@Component({
  selector: 'app-steam-widget',
  templateUrl: './steam-widget.component.html',
  styleUrls: ['./steam-widget.component.scss']
})
export class SteamWidgetComponent {
  public playerData: IPlayerDataResponse | null = null;
  public gameCount = 0;
  public pageSize = 25;
  public pageSizeOptions = [25];
  public pageNumber = 0;

  public steamUserId: string | undefined;

  public ownedGames: IGameInfo[] = [];

  public searchFormControl = new FormControl('');

  private ERROR_GETTING_PLAYER_DATA =
    'Erreur lors de la récupération de vos informations Steam.';
  private ERROR_GETTING_OWNED_GAMES =
    'Erreur lors de la récupération de la liste des jeux.';

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private steamWidgetService: SteamWidgetService
  ) {}

  public refreshWidget(): void {
    if (this.steamUserId) {
      const steamUserId = this.steamUserId;
      this.getPlayerData(steamUserId);
      this.getOwnedGames(
        this.steamUserId,
        this.searchFormControl.value || undefined,
        this.pageNumber
      );

      this.searchFormControl.valueChanges
        .pipe(debounceTime(500), distinctUntilChanged())
        .subscribe((searchValue) => {
          this.pageNumber = 0;
          this.getOwnedGames(steamUserId, searchValue || undefined);
        });
    }
  }

  public getPlayerData(steamUserId: string): void {
    this.steamWidgetService.getPlayerData(steamUserId).subscribe({
      next: (response: IPlayerDataResponse[]) =>
        (this.playerData = response[0]),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(
          error.message,
          this.ERROR_GETTING_PLAYER_DATA
        )
    });
  }

  public getOwnedGames(
    steamUserId: string,
    search?: string,
    pageNumber?: number
  ): void {
    this.steamWidgetService
      .getOwnedGames(steamUserId, search, pageNumber)
      .subscribe({
        next: (response: IOwnedGamesResponse) => {
          this.gameCount = response.gameCount;
          this.ownedGames = response.games;
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(
            error.message,
            this.ERROR_GETTING_OWNED_GAMES
          )
      });
  }

  public getGameImgSrc = (gameAppId: string, imgIconUrl: string): string =>
    `${this.steamWidgetService.STEAM_IMAGE_URL}${gameAppId}/${imgIconUrl}.jpg`;

  public getWidgetData = (): {
    steamUserId: string;
  } | null => (this.steamUserId ? { steamUserId: this.steamUserId } : null);

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

  public isFormValid(): boolean {
    return !!this.steamUserId && this.steamUserId?.length > 0;
  }

  public isWidgetLoaded(): boolean {
    return this.steamUserId != null && this.playerData != null;
  }
}

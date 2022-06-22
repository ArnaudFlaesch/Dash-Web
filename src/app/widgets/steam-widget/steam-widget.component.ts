import { ErrorHandlerService } from './../../services/error.handler.service';
import { Component } from '@angular/core';
import { SteamWidgetService } from './steam.widget.service';
import { HttpErrorResponse } from '@angular/common/http';
import { IPlayerData, IGameInfo, IPlayerDataResponse, IOwnedGamesResponse } from './ISteam';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-steam-widget',
  templateUrl: './steam-widget.component.html',
  styleUrls: ['./steam-widget.component.scss']
})
export class SteamWidgetComponent {
  public playerData: IPlayerData | null = null;
  public gameCount = 0;
  public pageSize = 25;
  public pageSizeOptions = [25];
  public pageNumber = 0;

  public ownedGames: IGameInfo[] = [];

  public searchFormControl = new FormControl('');

  private ERROR_GETTING_PLAYER_DATA = 'Erreur lors de la récupération de vos informations.';
  private ERROR_GETTING_OWNED_GAMES = 'Erreur lors de la récupération de la liste des jeux.';

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private steamWidgetService: SteamWidgetService
  ) {}

  public refreshWidget() {
    this.getPlayerData();
    this.getOwnedGames(this.searchFormControl.value || undefined, this.pageNumber);

    this.searchFormControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchValue) => {
        this.pageNumber = 0;
        this.getOwnedGames(searchValue || undefined);
      });
  }

  public getPlayerData(): void {
    this.steamWidgetService.getPlayerData().subscribe({
      next: (response: IPlayerDataResponse) => (this.playerData = response.response.players[0]),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error.message, this.ERROR_GETTING_PLAYER_DATA)
    });
  }

  public getOwnedGames(search?: string, pageNumber?: number): void {
    this.steamWidgetService.getOwnedGames(search, pageNumber).subscribe({
      next: (response: IOwnedGamesResponse) => {
        this.gameCount = response.response.game_count;
        this.ownedGames = response.response.games;
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error.message, this.ERROR_GETTING_OWNED_GAMES)
    });
  }

  public getGameImgSrc = (gameAppId: string, imgIconUrl: string) =>
    `${this.steamWidgetService.STEAM_IMAGE_URL}${gameAppId}/${imgIconUrl}.jpg`;

  public getWidgetData = () => <Record<string, string>>{};

  public onPageChanged(event: PageEvent): void {
    this.pageNumber = event.pageIndex;
    this.getOwnedGames(this.searchFormControl.value || undefined, this.pageNumber);
  }
}

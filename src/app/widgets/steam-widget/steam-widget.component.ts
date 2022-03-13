import { ErrorHandlerService } from './../../services/error.handler.service';
import { IGameInfo } from './IGameInfo';
import { IPlayerData } from './IPlayerData';
import { Component } from '@angular/core';
import { SteamWidgetService } from './steam.widget.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-steam-widget',
  templateUrl: './steam-widget.component.html',
  styleUrls: ['./steam-widget.component.scss']
})
export class SteamWidgetComponent {
  public playerData: IPlayerData | null = null;
  public ownedGames: IGameInfo[] = [];

  private ERROR_GETTING_PLAYER_DATA = 'Erreur lors de la récupération de vos informations.';
  private ERROR_GETTING_OWNED_GAMES = 'Erreur lors de la récupération de la liste des jeux.';

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private steamWidgetService: SteamWidgetService
  ) {}

  public refreshWidget() {
    this.getPlayerData();
    this.getOwnedGames();
  }

  public getPlayerData(): void {
    this.steamWidgetService.getPlayerData().subscribe({
      next: (response: any) => (this.playerData = response.response.players[0]),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error.message, this.ERROR_GETTING_PLAYER_DATA)
    });
  }

  public getOwnedGames(): void {
    this.steamWidgetService.getOwnedGames().subscribe({
      next: (response: any) =>
        (this.ownedGames = (response.response.games as IGameInfo[]).sort((gameA, gameB) =>
          gameA.name.localeCompare(gameB.name)
        )),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error.message, this.ERROR_GETTING_OWNED_GAMES)
    });
  }

  public getGameImgSrc = (gameAppId: string, imgIconUrl: string) =>
    `${this.steamWidgetService.STEAM_IMAGE_URL}${gameAppId}/${imgIconUrl}.jpg`;

  public getWidgetData = () => <Record<string, string>>{};
}

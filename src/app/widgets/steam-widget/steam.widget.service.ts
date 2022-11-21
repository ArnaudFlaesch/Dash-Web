import {
  IPlayerDataResponse,
  IAchievementResponse,
  IOwnedGamesResponse
} from './ISteam';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import authorizationBearer from '../../services/authorizationBearer/authorizationBearer';
import { environment } from '../../../environments/environment';

@Injectable()
export class SteamWidgetService {
  private _STEAM_IMAGE_URL =
    'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/';
  private _STEAM_COMMUNITY_URL = 'https://steamcommunity.com/app/';

  constructor(private http: HttpClient) {}

  get STEAM_IMAGE_URL(): string {
    return this._STEAM_IMAGE_URL;
  }

  get STEAM_COMMUNITY_URL(): string {
    return this._STEAM_COMMUNITY_URL;
  }

  public getPlayerData(steamUserId: string): Observable<IPlayerDataResponse[]> {
    return this.http.get<IPlayerDataResponse[]>(
      `${environment.backend_url}/steamWidget/playerData?steamUserId=${steamUserId}`,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }

  public getOwnedGames(
    steamUserId: string,
    search?: string,
    pageNumber?: number
  ): Observable<IOwnedGamesResponse> {
    const params: { search?: string; pageNumber?: number } = {};
    if (search) {
      params.search = search;
    }
    if (pageNumber) {
      params.pageNumber = pageNumber;
    }
    return this.http.get<IOwnedGamesResponse>(
      `${environment.backend_url}/steamWidget/ownedGames?steamUserId=${steamUserId}`,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        },
        params: params
      }
    );
  }

  public getAchievementList(
    steamUserId: string,
    appId: string
  ): Observable<IAchievementResponse> {
    return this.http.get<IAchievementResponse>(
      `${environment.backend_url}/steamWidget/achievementList`,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        },
        params: {
          steamUserId: steamUserId,
          appId: appId
        }
      }
    );
  }
}

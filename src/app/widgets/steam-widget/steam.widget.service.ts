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

  public getPlayerData(): Observable<unknown> {
    return this.http.get(`${environment.backend_url}/steamWidget/playerData`, {
      headers: {
        Authorization: authorizationBearer(),
        'Content-type': 'application/json'
      }
    });
  }

  public getOwnedGames(): Observable<unknown> {
    return this.http.get(`${environment.backend_url}/steamWidget/ownedGames`, {
      headers: {
        Authorization: authorizationBearer(),
        'Content-type': 'application/json'
      }
    });
  }

  public getAchievementList(appId: string): Observable<unknown> {
    return this.http.get(`${environment.backend_url}/steamWidget/achievementList`, {
      headers: {
        Authorization: authorizationBearer(),
        'Content-type': 'application/json'
      },
      params: {
        appId: appId
      }
    });
  }

  get STEAM_IMAGE_URL() {
    return this._STEAM_IMAGE_URL;
  }

  get STEAM_COMMUNITY_URL() {
    return this._STEAM_COMMUNITY_URL;
  }
}

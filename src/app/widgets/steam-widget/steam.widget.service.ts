import { IAchievementResponse, IGameInfoResponse, IPlayerDataResponse } from "./ISteam";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import authorizationBearer from "../../services/authorizationBearer/authorizationBearer";
import { environment } from "../../../environments/environment";
import { IPage } from "../../model/IPage";

@Injectable()
export class SteamWidgetService {
  private readonly _STEAM_IMAGE_URL =
    "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/";
  private readonly _STEAM_COMMUNITY_URL = "https://steamcommunity.com/app/";
  private readonly http = inject(HttpClient);

  public get STEAM_IMAGE_URL(): string {
    return this._STEAM_IMAGE_URL;
  }

  public get STEAM_COMMUNITY_URL(): string {
    return this._STEAM_COMMUNITY_URL;
  }

  public getPlayerData(steamUserId: string): Observable<IPlayerDataResponse[]> {
    return this.http.get<IPlayerDataResponse[]>(
      `${environment.backend_url}/steamWidget/playerData?steamUserId=${steamUserId}`,
      {
        headers: {
          Authorization: authorizationBearer(),
          "Content-type": "application/json"
        }
      }
    );
  }

  public getOwnedGames(
    steamUserId: string,
    search?: string,
    pageNumber?: number
  ): Observable<IPage<IGameInfoResponse>> {
    const params: { search?: string; pageNumber?: number } = {};
    if (search) {
      params.search = search;
    }
    if (pageNumber) {
      params.pageNumber = pageNumber;
    }
    return this.http.get<IPage<IGameInfoResponse>>(
      `${environment.backend_url}/steamWidget/ownedGames?steamUserId=${steamUserId}`,
      {
        headers: {
          Authorization: authorizationBearer(),
          "Content-type": "application/json"
        },
        params: params
      }
    );
  }

  public getAchievementList(steamUserId: string, appId: string): Observable<IAchievementResponse> {
    return this.http.get<IAchievementResponse>(
      `${environment.backend_url}/steamWidget/achievementList`,
      {
        headers: {
          Authorization: authorizationBearer(),
          "Content-type": "application/json"
        },
        params: {
          steamUserId: steamUserId,
          appId: appId
        }
      }
    );
  }
}

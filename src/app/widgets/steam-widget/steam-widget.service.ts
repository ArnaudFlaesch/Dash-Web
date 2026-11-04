import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { IPage } from "../../model/IPage";
import { IAchievementResponse, IGameInfoResponse, IPlayerDataResponse } from "./ISteam";

@Service()
export class SteamWidgetService {
  public static readonly STEAM_IMAGE_URL =
    "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/";

  public static readonly STEAM_COMMUNITY_URL = "https://steamcommunity.com/app/";

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/steamWidget`;

  public getPlayerData(steamUserId: string): Observable<IPlayerDataResponse[]> {
    return this.http.get<IPlayerDataResponse[]>(`${this.baseUrl}/playerData`, {
      params: { steamUserId }
    });
  }

  public getOwnedGames(
    steamUserId: string,
    search?: string,
    pageNumber?: number
  ): Observable<IPage<IGameInfoResponse>> {
    return this.http.get<IPage<IGameInfoResponse>>(`${this.baseUrl}/ownedGames`, {
      params: {
        steamUserId,
        ...(search ? { search } : {}),
        ...(pageNumber ? { pageNumber } : {})
      }
    });
  }

  public getAchievementList(steamUserId: string, appId: string): Observable<IAchievementResponse> {
    return this.http.get<IAchievementResponse>(`${this.baseUrl}/achievementList`, {
      params: { steamUserId, appId }
    });
  }
}

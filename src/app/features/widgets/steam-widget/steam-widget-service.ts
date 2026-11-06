import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";
import { Page } from "@shared/pagination/page";
import { AchievementResponse, GameInfoResponse, PlayerDataResponse } from "./steam";

@Service()
export class SteamWidgetService {
  public readonly STEAM_IMAGE_URL =
    "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/";

  public readonly STEAM_COMMUNITY_URL = "https://steamcommunity.com/app/";

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/steamWidget`;

  public getPlayerData(steamUserId: string): Observable<PlayerDataResponse[]> {
    return this.http.get<PlayerDataResponse[]>(`${this.baseUrl}/playerData`, {
      params: { steamUserId }
    });
  }

  public getOwnedGames(
    steamUserId: string,
    search?: string,
    pageNumber?: number
  ): Observable<Page<GameInfoResponse>> {
    return this.http.get<Page<GameInfoResponse>>(`${this.baseUrl}/ownedGames`, {
      // Angular would send undefined values as "undefined": the optional parameters are left out
      params: {
        steamUserId,
        ...(search ? { search } : {}),
        ...(pageNumber ? { pageNumber } : {})
      }
    });
  }

  public getAchievementList(steamUserId: string, appId: string): Observable<AchievementResponse> {
    return this.http.get<AchievementResponse>(`${this.baseUrl}/achievementList`, {
      params: { steamUserId, appId }
    });
  }
}

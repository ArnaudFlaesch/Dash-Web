/** Base URL of the icons of the Steam games. */
export const STEAM_IMAGE_URL =
  "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/";

/** Base URL of the community hubs of the Steam games. */
export const STEAM_COMMUNITY_URL = "https://steamcommunity.com/app/";

export interface PlayerDataResponse {
  personaname: string;
  profileurl: string;
  avatar: string;
}

export interface GameInfoResponse {
  appid: string;
  name: string;
  imgIconUrl: string;
  imgLogoUrl: string;
}

export interface GameInfoDisplay {
  appid: string;
  name: string;
  imgIconUrl: string;
  imgLogoUrl: string;
  gameImgSrc: string;
  appIdLink: string;
  playerAchievementUrl: string;
}

/** Games without achievements have no `achievements`, or even no `playerstats`. */
export interface AchievementResponse {
  playerstats?: {
    achievements?: Achievement[];
  };
}

export interface Achievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
}

/** Game to display, with the links to its icon, its community hub and the achievements of the player. */
export function toGameInfoDisplay(
  gameInfoResponse: GameInfoResponse,
  profileUrl: string | undefined
): GameInfoDisplay {
  const { appid, imgIconUrl } = gameInfoResponse;
  return {
    ...gameInfoResponse,
    appIdLink: STEAM_COMMUNITY_URL + appid,
    playerAchievementUrl: `${profileUrl}stats/${appid}/achievements/`,
    gameImgSrc: `${STEAM_IMAGE_URL}${appid}/${imgIconUrl}.jpg`
  };
}

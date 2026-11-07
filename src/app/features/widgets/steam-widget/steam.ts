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

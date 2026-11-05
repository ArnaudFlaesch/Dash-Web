export interface IPlayerDataResponse {
  personaname: string;
  profileurl: string;
  avatar: string;
}

export interface IGameInfoResponse {
  appid: string;
  name: string;
  imgIconUrl: string;
  imgLogoUrl: string;
}

export interface IGameInfoDisplay {
  appid: string;
  name: string;
  imgIconUrl: string;
  imgLogoUrl: string;
  gameImgSrc: string;
  appIdLink: string;
  playerAchievementUrl: string;
}

export interface IAchievementResponse {
  playerstats: {
    achievements: IAchievement[];
  };
}

export interface IAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
}

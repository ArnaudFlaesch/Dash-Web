export interface IPlayerDataResponse {
  personaname: string;
  profileurl: string;
  avatar: string;
}

export interface IOwnedGamesResponse {
  gameCount: number;
  games: IGameInfo[];
}

export interface IGameInfo {
  appid: string;
  name: string;
  imgIconUrl: string;
  imgLogoUrl: string;
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

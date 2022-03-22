export interface IPlayerDataResponse {
  response: {
    players: IPlayerData[];
  };
}

export interface IOwnedGamesResponse {
  response: {
    games: IGameInfo[];
  };
}

export interface IPlayerData {
  personaname: string;
  profileurl: string;
  avatar: string;
}

export interface IGameInfo {
  appid: string;
  name: string;
  img_icon_url: string;
  img_logo_url: string;
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

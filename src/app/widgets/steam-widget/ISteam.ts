export type IPlayerDataResponse = {
  personaname: string;
  profileurl: string;
  avatar: string;
};

export type IGameInfoResponse = {
  appid: string;
  name: string;
  imgIconUrl: string;
  imgLogoUrl: string;
};

export type IGameInfoDisplay = {
  appid: string;
  name: string;
  imgIconUrl: string;
  imgLogoUrl: string;
  gameImgSrc: string;
  appIdLink: string;
  playerAchievementUrl: string;
};

export type IAchievementResponse = {
  playerstats: {
    achievements: IAchievement[];
  };
};

export type IAchievement = {
  apiname: string;
  achieved: number;
  unlocktime: number;
};

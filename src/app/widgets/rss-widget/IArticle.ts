export type IRSSHeader = {
  feedUrl: string;
  image?: ImageContent;
  title: string;
  description: string;
  pubDate: string;
  link: string;
  language: string;
  copyright: string;
  lastBuildDate: string;
  docs: string;
  ttl: string;
  item: [IArticle];
};

export type IArticle = {
  guid: string;
  title?: string;
  link: string;
  content?: string;
  description?: string;
  author?: string;
  pubDate: string;
  updated?: string;
};

export type ImageContent = {
  link: string;
  url: string;
  title: string;
};

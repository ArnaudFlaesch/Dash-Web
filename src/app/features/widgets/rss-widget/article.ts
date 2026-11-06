export interface RssHeader {
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
  item: Article[];
}

export interface Article {
  guid: string;
  title?: string;
  link: string;
  content?: string;
  description?: string;
  author?: string;
  pubDate: string;
  updated?: string;
}

export interface ImageContent {
  link: string;
  url: string;
  title: string;
}

import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { advanceTo } from 'jest-date-mock';
import { IArticle } from '../IArticle';

import { RssFeedComponent } from './rss-feed.component';

describe('RssFeedComponent', () => {
  let spectator: Spectator<RssFeedComponent>;

  const createComponent = createComponentFactory({
    component: RssFeedComponent,
    imports: [],
    providers: []
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('Should get date to display', () => {
    advanceTo(new Date(2022, 2, 15, 0, 0, 0)); // 15/03/2022
    const article: IArticle = {
      title:
        "Fortnite : combien d'argent avez-vous dépensé dans les skins et les V-Bucks ? Voici comment savoir",
      link: 'https://www.jeuxvideo.com/news/1545197/fortnite-combien-d-argent-avez-vous-depense-dans-les-skins-et-les-v-bucks-voici-comment-savoir.htm',
      description:
        'Initialement sorti en juillet 2017 avec le mode de jeu Sauver le monde, Fortnite n&#039;a pas tardé à adopter la formule battle royale qui a contribué au succès de PUBG. Dès le mois de septembre 2017, le mode de jeu free-to-play a su conquérir les joueurs...',
      pubDate: 'Tue, 15 Mar 2022 19:00:02',
      guid: 'https://www.jeuxvideo.com/news/1545197/fortnite-combien-d-argent-avez-vous-depense-dans-les-skins-et-les-v-bucks-voici-comment-savoir.htm'
    };

    expect(spectator.component.formatTitleForArticle(article)).toEqual(`19:00 ${article.title}`);

    advanceTo(new Date(2022, 1, 15, 0, 0, 0)); // 15/02/2022
    expect(spectator.component.formatTitleForArticle(article)).toEqual(
      `15/03 19:00:02 ${article.title}`
    );

    advanceTo(new Date(2021, 1, 5, 0, 0, 0)); // 05/02/2021
    expect(spectator.component.formatTitleForArticle(article)).toEqual(
      `15/03/2022 19:00:02 ${article.title}`
    );
    article.updated = article.pubDate;
    article.pubDate = '';
    expect(spectator.component.formatTitleForArticle(article)).toEqual(
      `15/03/2022 19:00:02 ${article.title}`
    );
    article.title = '';
    expect(spectator.component.formatTitleForArticle(article)).toEqual(`15/03/2022 19:00:02 `);
  });

  it('Should remove html from article content', () => {
    const expectedContent = 'RSS content';
    const rssContent = `<div>${expectedContent}</div>`;
    expect(spectator.component.stripHtmlFromContent(rssContent)).toEqual(expectedContent);
  });

  it('Should check if an article is already read', () => {
    spectator.component.readArticles = ['1', '2'];
    expect(spectator.component.isArticleRead('3')).toEqual(false);
    expect(spectator.component.isArticleOpened('3')).toEqual(false);
  });

  it('Should mark article as read', () => {
    const markArticleAsReadEventSpy = jest.spyOn(
      spectator.component.markArticleAsReadEvent,
      'emit'
    );
    spectator.component.readArticles = ['1', '2'];
    spectator.detectChanges();
    spectator.component.onOpenDetail('3');
    expect(spectator.component.isArticleOpened('3')).toEqual(true);
    expect(markArticleAsReadEventSpy).toBeCalledTimes(1);
  });
});

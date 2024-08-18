import { advanceTo } from 'jest-date-mock';
import { IArticle } from '../IArticle';

import { TestBed } from '@angular/core/testing';
import { RssFeedComponent } from './rss-feed.component';

describe('RssFeedComponent', () => {
  let component: RssFeedComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      providers: []
    }).compileComponents();

    const fixture = TestBed.createComponent(RssFeedComponent);
    component = fixture.componentInstance;
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

    expect(component.formatTitleForArticle(article)).toEqual(`19:00 ${article.title}`);

    advanceTo(Date.parse('2022-02-15'));
    expect(component.formatTitleForArticle(article)).toEqual(`15/03 19:00:02 ${article.title}`);

    advanceTo(Date.parse('2021-02-05'));
    expect(component.formatTitleForArticle(article)).toEqual(
      `15/03/2022 19:00:02 ${article.title}`
    );
    article.updated = article.pubDate;
    article.pubDate = '';
    expect(component.formatTitleForArticle(article)).toEqual(
      `15/03/2022 19:00:02 ${article.title}`
    );
    article.title = '';
    expect(component.formatTitleForArticle(article)).toEqual(`15/03/2022 19:00:02 `);
  });

  it('Should remove html from article content', () => {
    expect(component.stripHtmlFromContent(`<div>${''}</div>`)).toEqual('');
    expect(component.stripHtmlFromContent(`<div></div>`)).toEqual('');
    const expectedContent = 'RSS content';
    expect(component.stripHtmlFromContent(`<div>${expectedContent}</div>`)).toEqual(
      expectedContent
    );
  });

  it('Should check if an article is already read', () => {
    component.readArticles = ['1', '2'];
    expect(component.isArticleRead('3')).toEqual(false);
    expect(component.isArticleOpened('3')).toEqual(false);
  });

  it('Should mark article as read', () => {
    const markArticleAsReadEventSpy = jest.spyOn(component.markArticleAsReadEvent, 'emit');
    component.readArticles = ['1', '2'];
    component.onOpenDetail('3');
    expect(component.isArticleOpened('3')).toEqual(true);
    expect(markArticleAsReadEventSpy).toHaveBeenCalledTimes(1);
    component.onClosePanel();
    expect(component.isArticleOpened('3')).toEqual(false);
  });
});

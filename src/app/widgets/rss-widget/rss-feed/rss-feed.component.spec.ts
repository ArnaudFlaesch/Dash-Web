import { IArticle } from "../IArticle";

import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RssFeedComponent } from "./rss-feed.component";
import { Mock, vi } from "vitest";

describe("RssFeedComponent", () => {
  let component: RssFeedComponent;
  let fixture: ComponentFixture<RssFeedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: []
    }).compileComponents();

    fixture = TestBed.createComponent(RssFeedComponent);
    component = fixture.componentInstance;
  });

  it("Should get date to display", () => {
    vi.setSystemTime(new Date(2022, 2, 15, 0, 0, 0)); // 15/03/2022
    const article: IArticle = {
      title:
        "Fortnite : combien d'argent avez-vous dépensé dans les skins et les V-Bucks ? Voici comment savoir",
      link: "https://www.jeuxvideo.com/news/1545197/fortnite-combien-d-argent-avez-vous-depense-dans-les-skins-et-les-v-bucks-voici-comment-savoir.htm",
      description:
        "Initialement sorti en juillet 2017 avec le mode de jeu Sauver le monde, Fortnite n&#039;a pas tardé à adopter la formule battle royale qui a contribué au succès de PUBG. Dès le mois de septembre 2017, le mode de jeu free-to-play a su conquérir les joueurs...",
      pubDate: "Tue, 15 Mar 2022 19:00:02",
      guid: "https://www.jeuxvideo.com/news/1545197/fortnite-combien-d-argent-avez-vous-depense-dans-les-skins-et-les-v-bucks-voici-comment-savoir.htm"
    };

    expect(component.formatTitleForArticle(article)).toEqual(`19:00 ${article.title}`);

    vi.setSystemTime(Date.parse("2022-02-15"));
    expect(component.formatTitleForArticle(article)).toEqual(`15/03 19:00:02 ${article.title}`);

    vi.setSystemTime(Date.parse("2021-02-05"));
    expect(component.formatTitleForArticle(article)).toEqual(
      `15/03/2022 19:00:02 ${article.title}`
    );
    article.updated = article.pubDate;
    article.pubDate = "";
    expect(component.formatTitleForArticle(article)).toEqual(
      `15/03/2022 19:00:02 ${article.title}`
    );
    article.title = "";
    expect(component.formatTitleForArticle(article)).toEqual(`15/03/2022 19:00:02 `);
  });

  it("Should remove html from article content", () => {
    expect(component.stripHtmlFromContent(`<div>${""}</div>`)).toEqual("");
    expect(component.stripHtmlFromContent(`<div></div>`)).toEqual("");
    expect(component.stripHtmlFromContent(undefined)).toEqual("");
    const expectedContent = "RSS content";
    expect(component.stripHtmlFromContent(`<div>${expectedContent}</div>`)).toEqual(
      expectedContent
    );
  });

  it("Should check if an article is already read", () => {
    fixture.componentRef.setInput("readArticles", ["1", "2"]);
    expect(component.isArticleRead("3")).toEqual(false);
    expect(component.isArticleOpened("3")).toEqual(false);
  });

  it("Should mark article as read", () => {
    const markArticleAsReadEventSpy = vi.spyOn(component.markArticleAsReadEvent, "emit");
    fixture.componentRef.setInput("readArticles", ["1", "2"]);
    component.onOpenDetail("3");
    expect(component.isArticleOpened("3")).toEqual(true);
    expect(markArticleAsReadEventSpy).toHaveBeenCalledTimes(1);
    component.onClosePanel();
    expect(component.isArticleOpened("3")).toEqual(false);
  });
});

describe("RssFeedComponent template", () => {
  let component: RssFeedComponent;
  let fixture: ComponentFixture<RssFeedComponent>;
  let element: HTMLElement;
  let markArticleAsReadSpy: Mock<(guid: string) => void>;

  const articles: IArticle[] = [
    {
      guid: "guid-1",
      title: "Premier article",
      link: "https://www.example.com/article-1",
      description: "<p>Contenu du <b>premier</b> article</p>",
      author: "Jean",
      pubDate: "2022-03-14T10:00:00.000Z"
    },
    {
      guid: "guid-2",
      title: "Second article",
      link: "https://www.example.com/article-2",
      description: "Contenu du second article",
      pubDate: "",
      updated: "2022-03-13T08:30:00.000Z"
    }
  ];

  beforeEach(async () => {
    vi.setSystemTime(new Date(2022, 2, 15, 12, 0, 0)); // 15/03/2022
    fixture = TestBed.createComponent(RssFeedComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    markArticleAsReadSpy = vi.fn();
    component.markArticleAsReadEvent.subscribe(markArticleAsReadSpy);
    fixture.componentRef.setInput("feed", articles);
    fixture.componentRef.setInput("readArticles", ["guid-1"]);
    await fixture.whenStable();
  });

  function getTitles(): HTMLElement[] {
    return [...element.querySelectorAll<HTMLElement>(".article-title")];
  }

  async function openArticle(index: number): Promise<void> {
    element.querySelectorAll<HTMLElement>("mat-expansion-panel-header")[index].click();
    await fixture.whenStable();
  }

  it("Should display the title of each article with its publication date", () => {
    expect(getTitles().map((title) => title.textContent?.trim())).toEqual(
      articles.map((article) => component.formatTitleForArticle(article))
    );
    expect(element.querySelector(".article-content")).toBeNull();
  });

  it("Should display the read articles differently", () => {
    expect(getTitles().map((title) => title.classList.contains("is-read"))).toEqual([true, false]);
  });

  it("Should display the content of an opened article and mark it as read", async () => {
    await openArticle(1);

    expect(markArticleAsReadSpy).toHaveBeenCalledWith("guid-2");
    expect(getTitles()[1].classList).toContain("article-opened");
    expect(getTitles()[0].classList).not.toContain("article-opened");
    const content = element.querySelector(".rss-feed-content");
    expect(content?.querySelector("a")?.getAttribute("href")).toEqual(articles[1].link);
    expect(content?.querySelector(".article-content")?.textContent?.trim()).toEqual(
      "Contenu du second article"
    );
    expect(content?.querySelector(".article-pubdate")?.textContent?.trim()).toEqual(
      `${component.labels.publishedOn} ${new Date(articles[1].updated!).toLocaleString("fr")}`
    );
  });

  it("Should display the content without html, the publication date and the author", async () => {
    await openArticle(0);

    // Already read
    expect(markArticleAsReadSpy).not.toHaveBeenCalled();
    expect(element.querySelector(".article-content")?.textContent?.trim()).toEqual(
      "Contenu du premier article"
    );
    expect(
      element.querySelector(".article-pubdate")?.textContent?.replace(/\s+/g, " ").trim()
    ).toEqual(
      `${component.labels.publishedOn} ${new Date(articles[0].pubDate).toLocaleString("fr")} ${component.labels.by} Jean`
    );
  });

  it("Should not display an invalid date for an article without publication date", async () => {
    const articleWithoutDate: IArticle = {
      guid: "guid-3",
      title: "Article sans date",
      link: "https://www.example.com/article-3",
      description: "Contenu",
      author: "Jean",
      pubDate: ""
    };
    fixture.componentRef.setInput("feed", [articleWithoutDate]);
    await fixture.whenStable();

    expect(getTitles()[0].textContent?.trim()).toEqual(articleWithoutDate.title);
    await openArticle(0);
    const publicationText = element.querySelector(".article-pubdate")?.textContent ?? "";
    expect(publicationText).not.toContain("Invalid Date");
    expect(publicationText).not.toContain(component.labels.publishedOn);
    expect(publicationText.trim()).toEqual(`${component.labels.by} Jean`);
  });

  it("Should keep Angular's sanitization of the article links", async () => {
    fixture.componentRef.setInput("feed", [
      { ...articles[0], guid: "guid-4", link: "javascript:alert(1)" }
    ]);
    await fixture.whenStable();
    await openArticle(0);

    expect(element.querySelector(".rss-feed-content a")?.getAttribute("href")).toEqual(
      "unsafe:javascript:alert(1)"
    );
  });

  it("Should close the opened article", async () => {
    await openArticle(1);
    await openArticle(1);
    expect(component.currentOpenedArticle()).toBeUndefined();
    expect(getTitles()[1].classList).not.toContain("article-opened");
  });
});

import { Article } from "../article";

import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RssFeed } from "./rss-feed";
import { Mock, vi } from "vitest";

describe("RssFeed", () => {
  let component: RssFeed;
  let fixture: ComponentFixture<RssFeed>;
  let element: HTMLElement;
  let markArticleAsReadSpy: Mock<(guid: string) => void>;

  const articles: Article[] = [
    {
      guid: "guid-1",
      title: "Premier article",
      link: "https://www.example.com/article-1",
      description: "<p>Contenu du <b>premier</b> article</p>",
      author: "Jean",
      // Local time, so that the displayed time doesn't depend on the time zone
      pubDate: "2022-03-14T10:00:00"
    },
    {
      guid: "guid-2",
      title: "Second article",
      link: "https://www.example.com/article-2",
      description: "Contenu du second article",
      pubDate: "",
      updated: "2022-03-13T08:30:00"
    }
  ];

  beforeEach(async () => {
    vi.setSystemTime(new Date(2022, 2, 15, 12, 0, 0)); // 15/03/2022
    fixture = TestBed.createComponent(RssFeed);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
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

  /** Displays a feed of the only given article, and returns its displayed title. */
  async function displayTitle(article: Article): Promise<string | undefined> {
    fixture.componentRef.setInput("feed", [{ ...article }]);
    await fixture.whenStable();
    return getTitles()[0].textContent?.trim();
  }

  it("Should display the title of each article with its publication date", () => {
    expect(getTitles().map((title) => title.textContent?.trim())).toEqual([
      "14/03 10:00:00 Premier article",
      "13/03 08:30:00 Second article"
    ]);
    expect(element.querySelector(".article-content")).toBeNull();
  });

  it("Should display the publication date depending on the current date", async () => {
    const article: Article = {
      title:
        "Fortnite : combien d'argent avez-vous dépensé dans les skins et les V-Bucks ? Voici comment savoir",
      link: "https://www.jeuxvideo.com/news/1545197/fortnite-combien-d-argent-avez-vous-depense-dans-les-skins-et-les-v-bucks-voici-comment-savoir.htm",
      description:
        "Initialement sorti en juillet 2017 avec le mode de jeu Sauver le monde, Fortnite n&#039;a pas tardé à adopter la formule battle royale qui a contribué au succès de PUBG. Dès le mois de septembre 2017, le mode de jeu free-to-play a su conquérir les joueurs...",
      pubDate: "Tue, 15 Mar 2022 19:00:02",
      guid: "https://www.jeuxvideo.com/news/1545197/fortnite-combien-d-argent-avez-vous-depense-dans-les-skins-et-les-v-bucks-voici-comment-savoir.htm"
    };

    // Today: only the time
    vi.setSystemTime(new Date(2022, 2, 15, 0, 0, 0));
    expect(await displayTitle(article)).toEqual(`19:00 ${article.title}`);

    // This year: without the year
    vi.setSystemTime(Date.parse("2022-02-15"));
    expect(await displayTitle(article)).toEqual(`15/03 19:00:02 ${article.title}`);

    // Another year: with the year
    vi.setSystemTime(Date.parse("2021-02-05"));
    expect(await displayTitle(article)).toEqual(`15/03/2022 19:00:02 ${article.title}`);

    // Update date when there is no publication date
    expect(await displayTitle({ ...article, pubDate: "", updated: article.pubDate })).toEqual(
      `15/03/2022 19:00:02 ${article.title}`
    );
    expect(
      await displayTitle({ ...article, pubDate: "", updated: article.pubDate, title: "" })
    ).toEqual("15/03/2022 19:00:02");
  });

  it("Should display the read articles differently", () => {
    expect(getTitles().map((title) => title.classList.contains("is-read"))).toEqual([true, false]);
    expect(getTitles().some((title) => title.classList.contains("article-opened"))).toBe(false);
  });

  it("Should display the content of an opened article and mark it as read", async () => {
    await openArticle(1);

    expect(markArticleAsReadSpy).toHaveBeenCalledTimes(1);
    expect(markArticleAsReadSpy).toHaveBeenCalledWith("guid-2");
    expect(getTitles()[1].classList).toContain("article-opened");
    expect(getTitles()[0].classList).not.toContain("article-opened");
    const content = element.querySelector(".rss-feed-content");
    expect(content?.querySelector("a")?.getAttribute("href")).toEqual(articles[1].link);
    expect(content?.querySelector(".article-content")?.textContent?.trim()).toEqual(
      "Contenu du second article"
    );
    expect(content?.querySelector(".article-pubdate")?.textContent?.trim()).toEqual(
      `Publié le ${new Date(articles[1].updated!).toLocaleString("fr")}`
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
    ).toEqual(`Publié le ${new Date(articles[0].pubDate).toLocaleString("fr")} par Jean`);
  });

  it.each([
    ["without description", undefined],
    ["with an empty html description", "<div></div>"]
  ])("Should display an empty content for an article %s", async (_, description) => {
    fixture.componentRef.setInput("feed", [{ ...articles[1], description }]);
    await fixture.whenStable();
    await openArticle(0);

    expect(element.querySelector(".article-content")?.textContent?.trim()).toEqual("");
  });

  it("Should not display an invalid date for an article without publication date", async () => {
    const articleWithoutDate: Article = {
      guid: "guid-3",
      title: "Article sans date",
      link: "https://www.example.com/article-3",
      description: "Contenu",
      author: "Jean",
      pubDate: ""
    };
    expect(await displayTitle(articleWithoutDate)).toEqual(articleWithoutDate.title);
    await openArticle(0);
    const publicationText = element.querySelector(".article-pubdate")?.textContent ?? "";
    expect(publicationText).not.toContain("Invalid Date");
    expect(publicationText).not.toContain("Publié le");
    expect(publicationText.trim()).toEqual("par Jean");
  });

  it("Should display an empty title for an article without date and title", async () => {
    expect(await displayTitle({ ...articles[0], pubDate: "", title: undefined })).toEqual("");
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
    expect(getTitles()[1].classList).not.toContain("article-opened");
    expect(markArticleAsReadSpy).toHaveBeenCalledTimes(1);
  });
});

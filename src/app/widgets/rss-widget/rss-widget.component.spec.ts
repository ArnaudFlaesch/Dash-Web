import { WIDGET_DATA, WIDGET_ID } from "@widgets/widget.tokens";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Mock, vi } from "vitest";
import { environment } from "@environments/environment";
import { ErrorHandlerService } from "@services/error-handler.service";
import { RssWidgetComponent } from "./rss-widget.component";

describe("RssWidgetComponent", () => {
  let component: RssWidgetComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: widgetId }
      ]
    })
      // Not rendered, so that the resources are only loaded by the test, not by the child components
      .overrideTemplate(RssWidgetComponent, "")
      .compileComponents();

    const fixture = TestBed.createComponent(RssWidgetComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  /** Lets the resources receive the flushed responses, then load the requests depending on them. */
  async function flushResources(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  const urlFeed = "https://www.jeuxvideo.com/rss/rss-pc.xml";
  const widgetId = "37";

  const rssFeedData = {
    version: "2.0",
    channel: {
      title: " PC - jeuxvideo.com",
      link: "https://www.jeuxvideo.com",
      description: "Le média de référence des gamers - Jeux Vidéo PC et Consoles - PC",
      language: "fr-fr",
      copyright: "Copyright 1997-2022 Webedia jeuxvideo.com",
      category: "Jeux Video",
      image: {
        title: "jeuxvideo.com",
        url: "https://www.jeuxvideo.com/img/jv-logo-amp.png",
        link: "https://www.jeuxvideo.com"
      },
      item: [
        {
          title:
            "Fortnite : combien d'argent avez-vous dépensé dans les skins et les V-Bucks ? Voici comment savoir",
          link: "https://www.jeuxvideo.com/news/1545197/fortnite-combien-d-argent-avez-vous-depense-dans-les-skins-et-les-v-bucks-voici-comment-savoir.htm",
          description:
            "Initialement sorti en juillet 2017 avec le mode de jeu Sauver le monde, Fortnite n&#039;a pas tardé à adopter la formule battle royale qui a contribué au succès de PUBG. Dès le mois de septembre 2017, le mode de jeu free-to-play a su conquérir les joueurs...",
          pubDate: "Tue, 15 Mar 2022 19:00:02 +0100",
          guid: "https://www.jeuxvideo.com/news/1545197/fortnite-combien-d-argent-avez-vous-depense-dans-les-skins-et-les-v-bucks-voici-comment-savoir.htm",
          creator: "luneera"
        },
        {
          title:
            "Hogwarts Legacy : Le jeu Harry Potter dévoile un extrait inédit avant son State of Play",
          link: "https://www.jeuxvideo.com/news/1545441/hogwarts-legacy-le-jeu-harry-potter-devoile-un-extrait-inedit-avant-son-state-of-play.htm",
          description:
            "Un peu de magie avant le Jour J\nDepuis son annonce courant 2020 lors d&#039;un événement dédié aux futurs jeux de la PlayStation 5, Hogwarts Legacy : l&#039;Héritage de Poudlard ne cesse de faire parler de lui. À raison puisque le titre qui se déroule au 19e siècle,...",
          pubDate: "Tue, 15 Mar 2022 18:51:21 +0100",
          guid: "https://www.jeuxvideo.com/news/1545441/hogwarts-legacy-le-jeu-harry-potter-devoile-un-extrait-inedit-avant-son-state-of-play.htm",
          creator: "JeromeJoffard"
        },
        {
          title: "Hideo Kojima reçoit un prix des Beaux-Arts ",
          link: "https://www.jeuxvideo.com/news/1545423/hideo-kojima-recoit-un-prix-des-beaux-arts.htm",
          description:
            "Hideo Kojima a reçu le soixante-douzième prix du Ministère de l&#039;Education, de la Culture, des Sports, de la Science et de la Technologie du Japon. Le prix des Beaux-Arts est décerné depuis 1950.\nUn prix prestigieux des Beaux-Arts pour Kojima\nAu sein du...",
          pubDate: "Tue, 15 Mar 2022 18:41:57 +0100",
          guid: "https://www.jeuxvideo.com/news/1545423/hideo-kojima-recoit-un-prix-des-beaux-arts.htm",
          creator: "Damien-Scaletta"
        },
        {
          title:
            "Infernal Affairs : une trilogie de thrillers à l'origine du GTA-like Sleeping Dogs",
          link: "https://www.jeuxvideo.com/news/1545103/infernal-affairs-une-trilogie-de-thrillers-a-l-origine-du-gta-like-sleeping-dogs.htm",
          description:
            "Dans Sleeping Dogs sorti en 2012 sur PC, PS3 et Xbox 360, nous incarnons Wei Shen, jeune flic infiltrée dans une triade de Hong Kong. Combats à mains nues, parkour et règlements de compte sont au programme, tout au long d’un scénario qui puisent ses inspirations...",
          pubDate: "Tue, 15 Mar 2022 18:22:22 +0100",
          guid: "https://www.jeuxvideo.com/news/1545103/infernal-affairs-une-trilogie-de-thrillers-a-l-origine-du-gta-like-sleeping-dogs.htm",
          creator: "Jiikaa"
        }
      ]
    }
  };

  it("Should read all articles", async () => {
    expect(component.rssFeedResult()?.item).toBeUndefined();
    component.config.update((config) => ({ ...config, url: urlFeed }));
    component.refreshWidget();
    TestBed.tick();

    expect(component.isWidgetLoaded()).toEqual(false);
    const request = httpTestingController.expectOne(
      environment.backend_url + "/rssWidget/?url=" + urlFeed
    );
    request.flush(rssFeedData);
    await flushResources();
    const feedLength = rssFeedData.channel.item.length;
    expect(component.rssFeedResult()?.item).toHaveLength(feedLength);
    const allArticlesGuids = rssFeedData.channel.item.map((item) => item.guid);

    component.markAllFeedAsRead();

    const markAllFeedAsReadRequest = httpTestingController.expectOne(
      environment.backend_url + `/widget/updateWidgetData/${widgetId}`
    );
    const updatedWidgetData = {
      data: { readArticlesGuids: allArticlesGuids }
    };
    markAllFeedAsReadRequest.flush(updatedWidgetData);

    expect(component.isWidgetLoaded()).toEqual(true);
    expect(component.readArticles()).toHaveLength(feedLength);
  });

  it("Should convert the guids of any type to strings", async () => {
    component.config.update((config) => ({ ...config, url: urlFeed }));
    component.refreshWidget();
    TestBed.tick();
    const article = rssFeedData.channel.item[0];
    httpTestingController.expectOne(environment.backend_url + "/rssWidget/?url=" + urlFeed).flush({
      channel: {
        ...rssFeedData.channel,
        item: [
          { ...article, guid: 42 },
          { ...article, guid: { isPermaLink: "false" } },
          { ...article, guid: null }
        ]
      }
    });
    await flushResources();
    expect(component.rssFeedResult()?.item.map((item) => item.guid)).toEqual([
      "42",
      JSON.stringify({ isPermaLink: "false" }),
      ""
    ]);
  });

  it("Should display an empty feed for a channel without articles", async () => {
    component.config.update((config) => ({ ...config, url: urlFeed }));
    component.refreshWidget();
    TestBed.tick();
    httpTestingController
      .expectOne(environment.backend_url + "/rssWidget/?url=" + urlFeed)
      .flush({ channel: { ...rssFeedData.channel, item: undefined } });
    await flushResources();
    expect(component.rssFeedResult()?.item).toEqual([]);
  });

  it("Should mark an article with an object guid as read", async () => {
    const articleUrl = "https://www.lemonde.fr/article.html";
    component.config.update((config) => ({ ...config, url: urlFeed }));
    component.refreshWidget();
    TestBed.tick();
    httpTestingController.expectOne(environment.backend_url + "/rssWidget/?url=" + urlFeed).flush({
      channel: {
        ...rssFeedData.channel,
        item: [{ ...rssFeedData.channel.item[0], guid: { isPermaLink: "true", "": articleUrl } }]
      }
    });
    await flushResources();
    expect(component.rssFeedResult()?.item[0].guid).toEqual(articleUrl);

    component.markArticleAsRead(articleUrl);
    // Displayed as read before the answer of the backend
    expect(component.readArticles()).toEqual([articleUrl]);
    const request = httpTestingController.expectOne(
      environment.backend_url + `/widget/updateWidgetData/${widgetId}`
    );
    expect(request.request.body.data.readArticlesGuids).toEqual([articleUrl]);
    request.flush({
      data: { readArticlesGuids: [{ isPermaLink: "true", "": articleUrl }, articleUrl] }
    });
    expect(component.readArticles()).toEqual([articleUrl]);
  });

  it("Should not load the feed while the url is missing", () => {
    component.refreshWidget();
    TestBed.tick();
    httpTestingController.expectNone(() => true);
    expect(component.rssFeedResult()).toBeUndefined();
  });

  it("Should not erase the read articles when the feed is not loaded", () => {
    component.readArticles.set(["guid-already-read"]);

    component.markAllFeedAsRead();

    httpTestingController.expectNone(
      environment.backend_url + `/widget/updateWidgetData/${widgetId}`
    );
    expect(component.readArticles()).toEqual(["guid-already-read"]);
  });

  it("Should have no read article when the saved widget has no data", async () => {
    component.config.update((config) => ({ ...config, url: urlFeed }));
    component.refreshWidget();
    TestBed.tick();
    httpTestingController
      .expectOne(environment.backend_url + "/rssWidget/?url=" + urlFeed)
      .flush(rssFeedData);
    await flushResources();

    component.markArticleAsRead(rssFeedData.channel.item[0].guid);
    httpTestingController
      .expectOne(environment.backend_url + `/widget/updateWidgetData/${widgetId}`)
      .flush({ id: 37 });

    expect(component.readArticles()).toEqual([]);
  });

  it("Should get widget data and check form", () => {
    expect(component.widgetData()).toBeUndefined();
    expect(component.isFormValid()).toEqual(false);
    const url = "localhost";
    component.config.update((config) => ({ ...config, url: url }));
    expect(component.widgetData()).toEqual({ url: url });
    expect(component.isFormValid()).toEqual(true);
  });

  it("Should fail to mark all articles as read", async () => {
    component.config.update((config) => ({ ...config, url: urlFeed }));
    component.refreshWidget();
    TestBed.tick();

    const request = httpTestingController.expectOne(
      environment.backend_url + "/rssWidget/?url=" + urlFeed
    );
    request.flush(rssFeedData);
    await flushResources();

    component.markAllFeedAsRead();
    httpTestingController
      .expectOne(environment.backend_url + `/widget/updateWidgetData/${widgetId}`)
      .error(new ProgressEvent("Server error"));

    expect(component.isWidgetLoaded()).toEqual(true);
    expect(component.readArticles()).toHaveLength(0);
  });
});

describe("RssWidgetComponent template", () => {
  const widgetId = 37;
  const urlFeed = "https://www.lemonde.fr/rss/une.xml";
  const rssFeedPath = environment.backend_url + "/rssWidget/?url=" + urlFeed;
  const updateWidgetPath = environment.backend_url + `/widget/updateWidgetData/${widgetId}`;
  const ERROR_GETTING_RSS_FEED = "Erreur pendant la récupération du flux RSS.";
  const ERROR_MARKING_FEED_AS_READ = "Erreur pendant la mise à jour du widget RSS.";

  const channel = {
    title: "Le Monde",
    description: "Toute l'actualité",
    link: "https://www.lemonde.fr",
    image: {
      title: "Le Monde",
      url: "https://www.lemonde.fr/logo.png",
      link: "https://www.lemonde.fr"
    },
    item: [
      {
        guid: "guid-1",
        title: "Premier article",
        link: "https://www.lemonde.fr/article-1",
        description: "Contenu du premier article",
        pubDate: "Tue, 15 Mar 2022 19:00:02 +0100"
      },
      {
        guid: "guid-2",
        title: "Second article",
        link: "https://www.lemonde.fr/article-2",
        description: "Contenu du second article",
        pubDate: "Tue, 15 Mar 2022 18:00:02 +0100"
      }
    ]
  };

  let fixture: ComponentFixture<RssWidgetComponent>;
  let component: RssWidgetComponent;
  let element: HTMLElement;
  let httpTestingController: HttpTestingController;

  function createComponent(widgetData: Record<string, unknown> | undefined): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: widgetId },
        { provide: WIDGET_DATA, useValue: widgetData }
      ]
    });
    fixture = TestBed.createComponent(RssWidgetComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    httpTestingController = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpTestingController.verify();
  });

  function query<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return element.querySelector<T>(selector);
  }

  function spyOnHandleError(): Mock {
    return vi
      .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
      .mockImplementation(() => undefined);
  }

  it("Should save the url typed in edit mode and load the feed", async () => {
    createComponent(undefined);
    await fixture.whenStable();
    const input = query<HTMLInputElement>("#rss-feed-url")!;
    expect(input.placeholder).toEqual(component.labels.enterRssFeedUrl);
    expect(query("mat-label")?.textContent).toEqual(component.labels.url);
    expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);

    input.value = urlFeed;
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();
    query(".validate-button")?.click();
    const saveRequest = httpTestingController.expectOne(updateWidgetPath);
    expect(saveRequest.request.body).toEqual({ data: { url: urlFeed } });
    saveRequest.flush({});
    // Not whenStable: the pending request of the feed would keep the fixture unstable
    TestBed.tick();

    httpTestingController.expectOne(rssFeedPath).flush({ channel });
    await fixture.whenStable();
    expect(query(".rss-widget-description")?.textContent).toEqual(channel.description);
  });

  describe("Read mode", () => {
    beforeEach(() => {
      createComponent({ url: urlFeed, readArticlesGuids: ["guid-1"] });
      TestBed.tick();
    });

    async function loadFeed(feed: object = { channel }): Promise<void> {
      httpTestingController.expectOne(rssFeedPath).flush(feed);
      await fixture.whenStable();
    }

    function getArticleTitles(): HTMLElement[] {
      return [...element.querySelectorAll<HTMLElement>(".article-title")];
    }

    it("Should display a spinner, then the feed", async () => {
      expect(query("mat-spinner")).toBeTruthy();
      await loadFeed();

      expect(query("mat-spinner")).toBeNull();
      const logo = query<HTMLImageElement>(".rss-widget-header");
      expect(logo?.src).toEqual(channel.image.url);
      expect(logo?.alt).toEqual(component.labels.logo);
      expect(query(".widget-header a")?.getAttribute("href")).toEqual(channel.image.link);
      expect(query(".widget-header .rss-title")?.textContent).toEqual(channel.title);
      expect(query(".rss-widget-description")?.textContent).toEqual(channel.description);
      expect(getArticleTitles()).toHaveLength(2);
      expect(getArticleTitles().map((title) => title.classList.contains("is-read"))).toEqual([
        true,
        false
      ]);
    });

    it("Should display the default icon when the logo can't be loaded", async () => {
      await loadFeed();
      query(".rss-widget-header")?.dispatchEvent(new Event("error"));
      await fixture.whenStable();
      expect(component.isLogoBroken()).toBe(true);
      expect(query(".rss-widget-header")).toBeNull();
      expect(query(".widget-header mat-icon")?.textContent).toEqual("rss_feed");
    });

    it("Should display the title without link and the default icon of a feed without image", async () => {
      await loadFeed({ channel: { ...channel, image: undefined } });
      expect(query(".rss-widget-header")).toBeNull();
      expect(query(".widget-header mat-icon")?.textContent).toEqual("rss_feed");
      expect(query(".widget-header a")).toBeNull();
      expect(query(".widget-header .rss-title")?.textContent).toEqual(channel.title);
    });

    it("Should display an empty feed for a response without channel", async () => {
      await loadFeed({});
      expect(component.rssFeedResult()).toBeUndefined();
      expect(query("mat-spinner")).toBeNull();
      expect(query(".rss-title")).toBeNull();
      expect(getArticleTitles()).toHaveLength(0);
    });

    it("Should mark an opened article as read", async () => {
      await loadFeed();
      element.querySelectorAll<HTMLElement>("mat-expansion-panel-header")[1].click();
      await fixture.whenStable();

      const request = httpTestingController.expectOne(updateWidgetPath);
      expect(request.request.method).toEqual("PATCH");
      expect(request.request.body).toEqual({
        data: { url: urlFeed, readArticlesGuids: ["guid-2", "guid-1"] }
      });
      expect(getArticleTitles()[1].classList).toContain("is-read");
      request.flush({ data: { url: urlFeed, readArticlesGuids: ["guid-2", "guid-1"] } });
      await fixture.whenStable();
      expect(component.readArticles()).toEqual(["guid-2", "guid-1"]);
    });

    it("Should mark all the feed as read", async () => {
      await loadFeed();
      query(".mark-all-articles-as-read-button")?.click();
      await fixture.whenStable();

      const request = httpTestingController.expectOne(updateWidgetPath);
      expect(request.request.body).toEqual({
        data: { url: urlFeed, readArticlesGuids: ["guid-1", "guid-2"] }
      });
      request.flush({ data: { url: urlFeed, readArticlesGuids: ["guid-1", "guid-2"] } });
      await fixture.whenStable();
      expect(getArticleTitles().every((title) => title.classList.contains("is-read"))).toBe(true);
    });

    it("Should restore the read articles and display an error when they can't be saved", async () => {
      const handleErrorSpy = spyOnHandleError();
      await loadFeed();
      query(".mark-all-articles-as-read-button")?.click();
      httpTestingController
        .expectOne(updateWidgetPath)
        .flush(null, { status: 500, statusText: "Server error" });
      await fixture.whenStable();

      expect(handleErrorSpy).toHaveBeenCalledWith(expect.anything(), ERROR_MARKING_FEED_AS_READ);
      expect(component.readArticles()).toEqual(["guid-1"]);
      expect(getArticleTitles().map((title) => title.classList.contains("is-read"))).toEqual([
        true,
        false
      ]);
    });

    it("Should reload the feed when the widget is refreshed", async () => {
      await loadFeed();
      query(".refresh-button")?.click();
      TestBed.tick();
      await loadFeed({ channel: { ...channel, item: [channel.item[0]] } });
      expect(getArticleTitles()).toHaveLength(1);
    });

    it("Should display an error when the feed can't be loaded", async () => {
      const handleErrorSpy = spyOnHandleError();
      httpTestingController
        .expectOne(rssFeedPath)
        .flush(null, { status: 500, statusText: "Server error" });
      await fixture.whenStable();

      expect(handleErrorSpy).toHaveBeenCalledWith(expect.anything(), ERROR_GETTING_RSS_FEED);
      expect(component.rssFeedResult()).toBeUndefined();
      expect(getArticleTitles()).toHaveLength(0);
    });
  });
});

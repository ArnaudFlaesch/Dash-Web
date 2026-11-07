import { WIDGET_DATA, WIDGET_ID } from "@widgets/widget-tokens";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { Mock, vi } from "vitest";
import { environment } from "@environments/environment";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { RssWidget } from "./rss-widget";

describe("RssWidget", () => {
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

  let fixture: ComponentFixture<RssWidget>;
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
    fixture = TestBed.createComponent(RssWidget);
    element = fixture.nativeElement as HTMLElement;
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

  describe("Edit mode", () => {
    beforeEach(async () => {
      createComponent(undefined);
      await fixture.whenStable();
    });

    it("Should not load the feed while the url is missing", async () => {
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);
      // Even if the widget asks for a refresh
      fixture.debugElement.query(By.css("dash-widget")).triggerEventHandler("refreshWidgetAction");
      await fixture.whenStable();

      httpTestingController.expectNone(() => true);
      expect(query(".rss-widget-body")).toBeNull();
    });

    it("Should save the url typed in edit mode and load the feed", async () => {
      const input = query<HTMLInputElement>("#rss-feed-url")!;
      expect(input.placeholder).toEqual("Saisissez l'URL du flux RSS");
      expect(query("mat-label")?.textContent).toEqual("URL");

      input.value = urlFeed;
      input.dispatchEvent(new Event("input"));
      await fixture.whenStable();
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(false);
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

    function getReadStates(): boolean[] {
      return getArticleTitles().map((title) => title.classList.contains("is-read"));
    }

    async function openArticle(index: number): Promise<void> {
      element.querySelectorAll<HTMLElement>("mat-expansion-panel-header")[index].click();
      await fixture.whenStable();
    }

    function markAllFeedAsRead(): void {
      query(".mark-all-articles-as-read-button")?.click();
      // Not whenStable: a pending request of the feed would keep the fixture unstable
      TestBed.tick();
    }

    it("Should display a spinner, then the feed", async () => {
      expect(query("mat-spinner")).toBeTruthy();
      await loadFeed();

      expect(query("mat-spinner")).toBeNull();
      const logo = query<HTMLImageElement>(".rss-widget-header");
      expect(logo?.src).toEqual(channel.image.url);
      expect(logo?.alt).toEqual("logo");
      expect(query(".widget-header a")?.getAttribute("href")).toEqual(channel.image.link);
      expect(query(".widget-header .rss-title")?.textContent).toEqual(channel.title);
      expect(query(".rss-widget-description")?.textContent).toEqual(channel.description);
      expect(getArticleTitles()).toHaveLength(2);
      expect(getReadStates()).toEqual([true, false]);
    });

    it("Should display the default icon when the logo can't be loaded", async () => {
      await loadFeed();
      query(".rss-widget-header")?.dispatchEvent(new Event("error"));
      await fixture.whenStable();
      expect(query(".rss-widget-header")).toBeNull();
      expect(query(".widget-header mat-icon")?.textContent).toEqual("rss_feed");

      // The logo is tried again on the next refresh, the url of the feed may have changed
      query(".refresh-button")?.click();
      TestBed.tick();
      await loadFeed();
      expect(query<HTMLImageElement>(".rss-widget-header")?.src).toEqual(channel.image.url);
    });

    it("Should label the button marking all the feed as read", async () => {
      await loadFeed();
      expect(query(".mark-all-articles-as-read-button")?.getAttribute("aria-label")).toEqual(
        "Marquer tout le flux comme lu"
      );
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
      expect(query("mat-spinner")).toBeNull();
      expect(query(".rss-title")).toBeNull();
      expect(query(".rss-widget-description")?.textContent).toEqual("");
      expect(getArticleTitles()).toHaveLength(0);
    });

    it("Should display an empty feed for a channel without articles", async () => {
      await loadFeed({ channel: { ...channel, item: undefined } });
      expect(query(".widget-header .rss-title")?.textContent).toEqual(channel.title);
      expect(getArticleTitles()).toHaveLength(0);

      // The feed is loaded but empty: marking it all as read saves no read article
      markAllFeedAsRead();
      httpTestingController
        .expectOne(updateWidgetPath)
        .flush({ data: { url: urlFeed, readArticlesGuids: [] } });
    });

    it("Should convert the guids of any type to strings", async () => {
      const article = channel.item[0];
      await loadFeed({
        channel: {
          ...channel,
          item: [
            { ...article, link: "https://www.lemonde.fr/42", guid: 42 },
            { ...article, link: "https://www.lemonde.fr/object", guid: { isPermaLink: "false" } },
            { ...article, link: "https://www.lemonde.fr/null", guid: null }
          ]
        }
      });

      markAllFeedAsRead();
      const request = httpTestingController.expectOne(updateWidgetPath);
      expect(request.request.body.data.readArticlesGuids).toEqual([
        "42",
        JSON.stringify({ isPermaLink: "false" }),
        ""
      ]);
      request.flush({});
    });

    it("Should mark an article with an object guid as read", async () => {
      const articleUrl = "https://www.lemonde.fr/article.html";
      await loadFeed({
        channel: {
          ...channel,
          item: [
            { ...channel.item[0], guid: { isPermaLink: "true", "": articleUrl } },
            channel.item[1]
          ]
        }
      });
      expect(getReadStates()).toEqual([false, false]);

      await openArticle(0);
      // Displayed as read before the answer of the backend
      expect(getReadStates()).toEqual([true, false]);
      const request = httpTestingController.expectOne(updateWidgetPath);
      expect(request.request.body.data.readArticlesGuids).toEqual([articleUrl, "guid-1"]);
      request.flush({
        data: { readArticlesGuids: [{ isPermaLink: "true", "": articleUrl }, articleUrl] }
      });
      await fixture.whenStable();
      expect(getReadStates()).toEqual([true, false]);

      // The saved guids are converted to strings, without duplicates
      await openArticle(1);
      const secondRequest = httpTestingController.expectOne(updateWidgetPath);
      expect(secondRequest.request.body.data.readArticlesGuids).toEqual(["guid-2", articleUrl]);
      secondRequest.flush({});
    });

    it("Should mark an opened article as read", async () => {
      await loadFeed();
      await openArticle(1);

      const request = httpTestingController.expectOne(updateWidgetPath);
      expect(request.request.method).toEqual("PATCH");
      expect(request.request.body).toEqual({
        data: { url: urlFeed, readArticlesGuids: ["guid-2", "guid-1"] }
      });
      expect(getArticleTitles()[1].classList).toContain("is-read");
      request.flush({ data: { url: urlFeed, readArticlesGuids: ["guid-2", "guid-1"] } });
      await fixture.whenStable();
      expect(getReadStates()).toEqual([true, true]);
    });

    it("Should have no read article when the saved widget has no data", async () => {
      await loadFeed();
      await openArticle(1);
      httpTestingController.expectOne(updateWidgetPath).flush({ id: widgetId });
      await fixture.whenStable();

      expect(getReadStates()).toEqual([false, false]);
    });

    it("Should mark all the feed as read", async () => {
      await loadFeed();
      markAllFeedAsRead();

      const request = httpTestingController.expectOne(updateWidgetPath);
      expect(request.request.body).toEqual({
        data: { url: urlFeed, readArticlesGuids: ["guid-1", "guid-2"] }
      });
      request.flush({ data: { url: urlFeed, readArticlesGuids: ["guid-1", "guid-2"] } });
      await fixture.whenStable();
      expect(query("mat-spinner")).toBeNull();
      expect(getReadStates()).toEqual([true, true]);
    });

    it("Should not erase the read articles when the feed is not loaded", async () => {
      // While the feed is loading
      markAllFeedAsRead();
      httpTestingController.expectNone(updateWidgetPath);

      await loadFeed();
      expect(getReadStates()).toEqual([true, false]);
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
      expect(query("mat-spinner")).toBeNull();
      expect(getReadStates()).toEqual([true, false]);
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
      expect(query(".rss-title")).toBeNull();
      expect(getArticleTitles()).toHaveLength(0);

      // Without a loaded feed, the read articles are kept
      markAllFeedAsRead();
      httpTestingController.expectNone(updateWidgetPath);
    });
  });

  it("Should restore the saved configuration when the edition is cancelled", async () => {
    createComponent({ url: urlFeed });
    TestBed.tick();
    httpTestingController.expectOne(rssFeedPath).flush({ channel });
    await fixture.whenStable();
    const openEdition = async (): Promise<void> => {
      element.querySelector<HTMLElement>(".edit-button")!.click();
      await fixture.whenStable();
    };
    await openEdition();
    const input = element.querySelector<HTMLInputElement>("#rss-feed-url")!;
    input.value = "https://other.feed/rss";
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();

    element.querySelector<HTMLElement>(".cancel-button")!.click();
    await fixture.whenStable();
    await openEdition();
    expect(element.querySelector<HTMLInputElement>("#rss-feed-url")!.value).toEqual(urlFeed);
  });
});

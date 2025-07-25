import { MatSnackBarModule } from "@angular/material/snack-bar";

import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { environment } from "../../../environments/environment";
import { DateUtilsService } from "../../services/date.utils.service/date.utils.service";
import { ErrorHandlerService } from "./../../services/error.handler.service";
import { WidgetService } from "./../../services/widget.service/widget.service";
import { RssWidgetComponent } from "./rss-widget.component";
import { RssWidgetService } from "./rss.widget.service";

describe("RssWidgetComponent", () => {
  let component: RssWidgetComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatSnackBarModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RssWidgetService,
        DateUtilsService,
        WidgetService,
        ErrorHandlerService,
        { provide: "widgetId", useValue: widgetId }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(RssWidgetComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

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

  it("Should read all articles", () => {
    expect(component.rssFeedResult?.item).toEqual(undefined);
    component.urlFeed = urlFeed;
    component.refreshWidget();

    expect(component.isWidgetLoaded()).toEqual(false);
    const request = httpTestingController.expectOne(
      environment.backend_url + "/rssWidget/?url=" + urlFeed
    );
    request.flush(rssFeedData);
    const feedLength = rssFeedData.channel.item.length;
    expect(component.rssFeedResult?.item.length).toEqual(feedLength);
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
    expect(component.readArticles().length).toEqual(feedLength);
  });

  it("Should get widget data and check form", () => {
    expect(component.getWidgetData()).toEqual(undefined);
    expect(component.isFormValid()).toEqual(false);
    const url = "localhost";
    component.urlFeed = url;
    expect(component.getWidgetData()).toEqual({ url: url });
    expect(component.isFormValid()).toEqual(true);
  });

  it("Should fail to mark all articles as read", () => {
    component.urlFeed = urlFeed;
    component.refreshWidget();

    const request = httpTestingController.expectOne(
      environment.backend_url + "/rssWidget/?url=" + urlFeed
    );
    request.flush(rssFeedData);

    component.markAllFeedAsRead();
    httpTestingController
      .expectOne(environment.backend_url + `/widget/updateWidgetData/${widgetId}`)
      .error(new ProgressEvent("Server error"));

    expect(component.isWidgetLoaded()).toEqual(true);
    expect(component.readArticles().length).toEqual(0);
  });
});

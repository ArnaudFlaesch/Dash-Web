import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ErrorHandlerService } from "../../../services/error-handler.service";
import { IGameInfoDisplay } from "../ISteam";
import { SteamWidgetService } from "../steam-widget.service";
import { environment } from "../../../../environments/environment";
import { GameDetailsComponent } from "./game-details.component";
import { provideHttpClient } from "@angular/common/http";
import { vi } from "vitest";
import { ComponentRef } from "@angular/core";

describe("GameDetailsComponent", () => {
  let component: GameDetailsComponent;
  let fixture: ComponentFixture<GameDetailsComponent>;
  let componentRef: ComponentRef<GameDetailsComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        SteamWidgetService,
        provideHttpClient(),
        provideHttpClientTesting(),
        ErrorHandlerService
      ]
    })
      // Not rendered, so that the resources are only loaded by the test, not by the child components
      .overrideTemplate(GameDetailsComponent, "")
      .compileComponents();

    fixture = TestBed.createComponent(GameDetailsComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    httpTestingController = TestBed.inject(HttpTestingController);
    componentRef.setInput("steamUserId", "1337");
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  /** Lets the resources receive the flushed responses, then load the requests depending on them. */
  async function flushResources(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  describe("Normal cases", () => {
    it("should create", async () => {
      const steamUserId = "1237";
      const appId = "1337";
      const achievementsData = {
        playerstats: {
          steamID: "76561198046131373",
          gameName: "Half-Life 2: Episode Two",
          achievements: [
            {
              apiname: "EP2_KILL_POISONANTLION",
              achieved: 1,
              unlocktime: 1352488322
            },
            {
              apiname: "EP2_KILL_ALLGRUBS",
              achieved: 0,
              unlocktime: 0
            },
            {
              apiname: "EP2_BREAK_ALLWEBS",
              achieved: 1,
              unlocktime: 1446892109
            },
            {
              apiname: "EP2_BEAT_ANTLIONINVASION",
              achieved: 1,
              unlocktime: 1352489474
            },
            {
              apiname: "EP2_BEAT_ANTLIONGUARDS",
              achieved: 1,
              unlocktime: 1352492128
            }
          ],
          success: true
        }
      };
      expect(component.achievements()).toEqual([]);
      expect(component.completedAchievements()).toEqual([]);
      fixture.componentRef.setInput("gameInfo", {
        appid: appId,
        name: "Super Game"
      } as IGameInfoDisplay);

      componentRef.setInput("steamUserId", steamUserId);
      component.loadAchievementsData();
      TestBed.tick();
      const getAchievementsRequest = httpTestingController.expectOne(
        environment.backend_url +
          "/steamWidget/achievementList?steamUserId=" +
          steamUserId +
          "&appId=" +
          appId
      );
      getAchievementsRequest.flush(achievementsData);
      await flushResources();
      expect(component.achievements().length).toEqual(5);
      expect(component.completedAchievements().length).toEqual(4);
      expect(component.completionStatus()).toEqual(80);
    });
  });

  describe("Error cases", () => {
    it("should display error messages", async () => {
      const steamUserId = "1237";
      const appId = "1337";

      fixture.componentRef.setInput("gameInfo", {
        appid: appId,
        name: "Super Game"
      } as IGameInfoDisplay);

      componentRef.setInput("steamUserId", steamUserId);
      component.loadAchievementsData();
      TestBed.tick();
      httpTestingController
        .expectOne(
          environment.backend_url +
            "/steamWidget/achievementList?steamUserId=" +
            steamUserId +
            "&appId=" +
            appId
        )
        .error(new ProgressEvent("Server error"));
      await flushResources();
      expect(component.achievements()).toHaveLength(0);
    });
  });
});

describe("GameDetailsComponent rendering", () => {
  const gameInfo: IGameInfoDisplay = {
    appid: "220",
    name: "Half-Life 2",
    imgIconUrl: "icon",
    imgLogoUrl: "logo",
    gameImgSrc: "https://steam.example/220/icon.jpg",
    appIdLink: "https://steamcommunity.com/app/220",
    playerAchievementUrl: "https://steamcommunity.com/id/Nauno93/stats/220/achievements/"
  };
  const achievementsUrl =
    environment.backend_url + "/steamWidget/achievementList?steamUserId=1337&appId=220";

  let fixture: ComponentFixture<GameDetailsComponent>;
  let component: GameDetailsComponent;
  let element: HTMLElement;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(GameDetailsComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput("steamUserId", "1337");
    fixture.componentRef.setInput("profileUrl", "https://steamcommunity.com/id/Nauno93/");
    fixture.componentRef.setInput("gameInfo", gameInfo);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  /** Opens the panel of the game, which loads its achievements. */
  function openPanel(): void {
    (element.querySelector("mat-expansion-panel-header") as HTMLElement).click();
    TestBed.tick();
  }

  it("should display the game, without loading its achievements", () => {
    const image = element.querySelector(".game-info img") as HTMLImageElement;
    expect(image.src).toEqual(gameInfo.gameImgSrc);
    expect(image.alt).toEqual(component.labels.gameIcon);
    expect(element.querySelector(".game-info p")?.textContent).toContain(gameInfo.name);
    expect(element.querySelector(".game-panel")?.getAttribute("title")).toEqual(gameInfo.name);
    httpTestingController.expectNone(achievementsUrl);
  });

  it("should display the achievements once the panel is opened", async () => {
    openPanel();
    expect(element.querySelector("mat-progress-spinner")).not.toBeNull();
    httpTestingController.expectOne(achievementsUrl).flush({
      playerstats: {
        achievements: [
          { apiname: "A", achieved: 1, unlocktime: 1 },
          { apiname: "B", achieved: 0, unlocktime: 0 },
          { apiname: "C", achieved: 1, unlocktime: 1 }
        ]
      }
    });
    await fixture.whenStable();

    expect(element.querySelector("mat-progress-spinner")).toBeNull();
    expect(element.querySelector(".progress-value")?.textContent).toContain(
      `66${component.labels.percent}`
    );
    expect(element.querySelector(".achievements-progress")?.getAttribute("href")).toEqual(
      gameInfo.playerAchievementUrl
    );
    expect(element.querySelector(".totalachievements")?.textContent).toContain(
      `${component.labels.achievements} 3`
    );
    expect(element.querySelector(".completed-achievements")?.textContent).toContain(
      `${component.labels.completedAchievements} 2`
    );
    const communityHubLink = element.querySelector(".community-hub-link") as HTMLAnchorElement;
    expect(communityHubLink.getAttribute("href")).toEqual(gameInfo.appIdLink);
    expect(communityHubLink.textContent).toContain(component.labels.communityHub);
    expect(element.querySelector(".no-achievements")).toBeNull();
  });

  it("should display a message for a game without achievements", async () => {
    openPanel();
    httpTestingController.expectOne(achievementsUrl).flush({ playerstats: {} });
    await fixture.whenStable();

    const noAchievements = element.querySelector(".no-achievements");
    expect(noAchievements?.textContent).toContain(component.labels.noAchievements);
    expect(noAchievements?.querySelector("a")?.getAttribute("href")).toEqual(gameInfo.appIdLink);
    expect(component.completionStatus()).toBeUndefined();
    expect(element.querySelector(".achievements-progress")).toBeNull();
  });

  it("should handle the error when getting the achievements", async () => {
    const handleErrorSpy = vi
      .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
      .mockImplementation(() => undefined);
    openPanel();
    httpTestingController
      .expectOne(achievementsUrl)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await fixture.whenStable();

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la récupération des succès."
    );
    expect(element.querySelector(".no-achievements")).not.toBeNull();
  });
});

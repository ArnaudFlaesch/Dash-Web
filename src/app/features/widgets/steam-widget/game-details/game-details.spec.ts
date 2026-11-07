import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { GameInfoDisplay } from "../steam";
import { environment } from "@environments/environment";
import { GameDetails } from "./game-details";
import { provideHttpClient } from "@angular/common/http";
import { vi } from "vitest";

describe("GameDetails", () => {
  const gameInfo: GameInfoDisplay = {
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

  let fixture: ComponentFixture<GameDetails>;
  let element: HTMLElement;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(GameDetails);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput("steamUserId", "1337");
    fixture.componentRef.setInput("gameInfo", gameInfo);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  /** Opens the panel of the game, which loads its achievements. */
  function openPanel(): void {
    element.querySelector<HTMLElement>("mat-expansion-panel-header")!.click();
    TestBed.tick();
  }

  it("should display the game, without loading its achievements", () => {
    const image = element.querySelector<HTMLImageElement>(".game-info img")!;
    expect(image.src).toEqual(gameInfo.gameImgSrc);
    expect(image.alt).toEqual("game icon");
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
    // Exact texts, without surrounding spaces, as checked by the end-to-end tests
    expect(element.querySelector(".progress-value")?.textContent).toEqual("66%");
    expect(element.querySelector(".achievements-progress")?.getAttribute("href")).toEqual(
      gameInfo.playerAchievementUrl
    );
    expect(element.querySelector(".totalachievements")?.textContent).toEqual("Succès : 3");
    expect(element.querySelector(".completed-achievements")?.textContent).toEqual(
      "Succès complétés : 2"
    );
    const communityHubLink = element.querySelector<HTMLAnchorElement>(".community-hub-link")!;
    expect(communityHubLink.getAttribute("href")).toEqual(gameInfo.appIdLink);
    expect(communityHubLink.textContent).toContain("Community hub");
    expect(element.querySelector(".no-achievements")).toBeNull();
  });

  it("should load the achievements of the given player and game", async () => {
    const steamUserId = "1237";
    const appId = "1337";
    fixture.componentRef.setInput("steamUserId", steamUserId);
    fixture.componentRef.setInput("gameInfo", { ...gameInfo, appid: appId, name: "Super Game" });
    await fixture.whenStable();

    openPanel();
    httpTestingController
      .expectOne(
        environment.backend_url +
          "/steamWidget/achievementList?steamUserId=" +
          steamUserId +
          "&appId=" +
          appId
      )
      .flush({
        playerstats: {
          steamID: "76561198046131373",
          gameName: "Half-Life 2: Episode Two",
          achievements: [
            { apiname: "EP2_KILL_POISONANTLION", achieved: 1, unlocktime: 1352488322 },
            { apiname: "EP2_KILL_ALLGRUBS", achieved: 0, unlocktime: 0 },
            { apiname: "EP2_BREAK_ALLWEBS", achieved: 1, unlocktime: 1446892109 },
            { apiname: "EP2_BEAT_ANTLIONINVASION", achieved: 1, unlocktime: 1352489474 },
            { apiname: "EP2_BEAT_ANTLIONGUARDS", achieved: 1, unlocktime: 1352492128 }
          ],
          success: true
        }
      });
    await fixture.whenStable();

    expect(element.querySelector(".progress-value")?.textContent).toEqual("80%");
    expect(element.querySelector(".totalachievements")?.textContent).toEqual("Succès : 5");
    expect(element.querySelector(".completed-achievements")?.textContent).toEqual(
      "Succès complétés : 4"
    );
  });

  it("should display a message for a game without achievements", async () => {
    openPanel();
    httpTestingController.expectOne(achievementsUrl).flush({ playerstats: {} });
    await fixture.whenStable();

    const noAchievements = element.querySelector(".no-achievements");
    expect(noAchievements?.textContent).toContain("Aucun succès pour ce jeu.");
    expect(noAchievements?.querySelector("a")?.getAttribute("href")).toEqual(gameInfo.appIdLink);
    expect(noAchievements?.querySelector("a")?.textContent).toContain("Community hub");
    expect(element.querySelector(".achievements-progress")).toBeNull();
    expect(element.querySelector(".progress-value")).toBeNull();
  });

  it("should display a message for a game without player stats", async () => {
    openPanel();
    httpTestingController.expectOne(achievementsUrl).flush({});
    await fixture.whenStable();

    expect(element.querySelector(".no-achievements")?.textContent).toContain(
      "Aucun succès pour ce jeu."
    );
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
    expect(element.querySelector("mat-progress-spinner")).toBeNull();
    expect(element.querySelector(".no-achievements")).not.toBeNull();
    expect(element.querySelector(".achievements-progress")).toBeNull();
  });
});

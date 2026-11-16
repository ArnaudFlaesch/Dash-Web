import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { Achievement, GameInfoDisplay } from "../steam";
import { GameDetails } from "./game-details";

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
  const achievements: Achievement[] = [
    { apiname: "A", achieved: 1, unlocktime: 1 },
    { apiname: "B", achieved: 0, unlocktime: 0 },
    { apiname: "C", achieved: 1, unlocktime: 1 }
  ];

  let fixture: ComponentFixture<GameDetails>;
  let element: HTMLElement;
  let achievementsRequestedSpy: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(GameDetails);
    element = fixture.nativeElement as HTMLElement;
    achievementsRequestedSpy = vi.fn<() => void>();
    fixture.componentInstance.achievementsRequested.subscribe(achievementsRequestedSpy);
    fixture.componentRef.setInput("gameInfo", gameInfo);
    await fixture.whenStable();
  });

  /** Opens the panel of the game, which requests its achievements. */
  async function openPanel(): Promise<void> {
    element.querySelector<HTMLElement>("mat-expansion-panel-header")!.click();
    await fixture.whenStable();
  }

  /** Gives the state of the achievements to the game, as the container does. */
  async function setAchievements(
    loadedAchievements: Achievement[] | undefined,
    isLoading = false
  ): Promise<void> {
    fixture.componentRef.setInput("achievements", loadedAchievements);
    fixture.componentRef.setInput("isLoading", isLoading);
    await fixture.whenStable();
  }

  it("should display the game, without requesting its achievements", () => {
    const image = element.querySelector<HTMLImageElement>(".game-info img")!;
    expect(image.src).toEqual(gameInfo.gameImgSrc);
    expect(image.alt).toEqual("game icon");
    expect(element.querySelector(".game-info p")?.textContent).toContain(gameInfo.name);
    expect(element.querySelector(".game-panel")?.getAttribute("title")).toEqual(gameInfo.name);
    expect(achievementsRequestedSpy).not.toHaveBeenCalled();
  });

  it("should request the achievements each time the panel is opened", async () => {
    await openPanel();
    expect(achievementsRequestedSpy).toHaveBeenCalledTimes(1);

    // Closed, then opened again
    await openPanel();
    await openPanel();
    expect(achievementsRequestedSpy).toHaveBeenCalledTimes(2);
  });

  it("should display a spinner while the achievements are loading", async () => {
    await setAchievements(undefined, true);
    await openPanel();

    expect(element.querySelector("mat-progress-spinner")).not.toBeNull();
    expect(element.querySelector(".no-achievements")).toBeNull();
    expect(element.querySelector(".achievements-progress")).toBeNull();
  });

  it("should display the achievements once they are loaded", async () => {
    await openPanel();
    await setAchievements(achievements);

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

  it("should round down the completion of the achievements", async () => {
    await openPanel();
    await setAchievements([
      { apiname: "EP2_KILL_POISONANTLION", achieved: 1, unlocktime: 1352488322 },
      { apiname: "EP2_KILL_ALLGRUBS", achieved: 0, unlocktime: 0 },
      { apiname: "EP2_BREAK_ALLWEBS", achieved: 1, unlocktime: 1446892109 },
      { apiname: "EP2_BEAT_ANTLIONINVASION", achieved: 1, unlocktime: 1352489474 },
      { apiname: "EP2_BEAT_ANTLIONGUARDS", achieved: 1, unlocktime: 1352492128 }
    ]);

    expect(element.querySelector(".progress-value")?.textContent).toEqual("80%");
    expect(element.querySelector(".totalachievements")?.textContent).toEqual("Succès : 5");
    expect(element.querySelector(".completed-achievements")?.textContent).toEqual(
      "Succès complétés : 4"
    );
  });

  it("should display a message for a game without achievements", async () => {
    await openPanel();
    await setAchievements([]);

    expect(element.querySelector("mat-progress-spinner")).toBeNull();
    const noAchievements = element.querySelector(".no-achievements");
    expect(noAchievements?.textContent).toContain("Aucun succès pour ce jeu.");
    expect(noAchievements?.querySelector("a")?.getAttribute("href")).toEqual(gameInfo.appIdLink);
    expect(noAchievements?.querySelector("a")?.textContent).toContain("Community hub");
    expect(element.querySelector(".achievements-progress")).toBeNull();
    expect(element.querySelector(".progress-value")).toBeNull();
  });
});

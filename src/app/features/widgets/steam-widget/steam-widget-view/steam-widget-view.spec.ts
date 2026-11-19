import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { vi } from "vitest";
import { Achievement, GameInfoDisplay } from "../steam";
import { GameDetails } from "../game-details/game-details";
import { SteamWidgetView } from "./steam-widget-view";

describe("SteamWidgetView", () => {
  const games: GameInfoDisplay[] = [
    {
      appid: "220",
      name: "Half-Life 2",
      imgIconUrl: "icon220",
      imgLogoUrl: "logo220",
      gameImgSrc: "https://steam.example/220/icon220.jpg",
      appIdLink: "https://steamcommunity.com/app/220",
      playerAchievementUrl: "https://steamcommunity.com/id/Nauno93/stats/220/achievements/"
    },
    {
      appid: "340",
      name: "Half-Life 2: Lost Coast",
      imgIconUrl: "icon340",
      imgLogoUrl: "logo",
      gameImgSrc: "https://steam.example/340/icon340.jpg",
      appIdLink: "https://steamcommunity.com/app/340",
      playerAchievementUrl: "https://steamcommunity.com/id/Nauno93/stats/340/achievements/"
    }
  ];
  const achievements: Achievement[] = [{ apiname: "A", achieved: 1, unlocktime: 1 }];

  let fixture: ComponentFixture<SteamWidgetView>;
  let element: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(SteamWidgetView);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput("searchQuery", "");
    fixture.componentRef.setInput("isGamesListDisplayed", true);
    fixture.componentRef.setInput("isGamesLoading", false);
    fixture.componentRef.setInput("games", games);
    fixture.componentRef.setInput("gameCount", 30);
    fixture.componentRef.setInput("pageNumber", 0);
    fixture.componentRef.setInput("achievementsByAppId", {});
    fixture.componentRef.setInput("loadingAchievementsAppIds", new Set<string>());
    await fixture.whenStable();
  });

  function getGameDetails(): NodeListOf<HTMLElement> {
    return element.querySelectorAll("dash-game-details");
  }

  function getGameDetailsComponents(): GameDetails[] {
    return fixture.debugElement
      .queryAll(By.directive(GameDetails))
      .map((debugElement) => debugElement.componentInstance as GameDetails);
  }

  function getPaginatorRange(): string | undefined {
    return element.querySelector(".mat-mdc-paginator-range-label")?.textContent?.trim();
  }

  it("should display the games, the search field and the paginator", () => {
    const gameDetails = getGameDetails();
    expect(gameDetails).toHaveLength(2);
    expect(gameDetails[0].textContent).toContain("Half-Life 2");
    expect(gameDetails[1].textContent).toContain("Half-Life 2: Lost Coast");
    expect(getGameDetailsComponents()[0].gameInfo()).toEqual(games[0]);
    expect(element.querySelector(".no-game-found")).toBeNull();
    expect(element.querySelector(".games-loading")).toBeNull();
    expect(element.querySelector(".search-game-form mat-label")?.textContent).toContain(
      "Recherchez un jeu"
    );
    expect(element.querySelector(".reset-form-button")).toBeNull();
    expect(getPaginatorRange()).toMatch(/^1\D+25\D+30$/);
    expect(element.querySelector("mat-paginator")?.getAttribute("aria-label")).toEqual(
      "Sélectionnez une page"
    );
  });

  it("should display the selected page", async () => {
    fixture.componentRef.setInput("pageNumber", 1);
    await fixture.whenStable();
    expect(getPaginatorRange()).toMatch(/^26\D+30\D+30$/);
  });

  it("should display a spinner while the games are loading", async () => {
    fixture.componentRef.setInput("isGamesLoading", true);
    await fixture.whenStable();

    expect(element.querySelector(".games-loading")).not.toBeNull();
    expect(getGameDetails()).toHaveLength(0);
  });

  it("should display a message when no game is found", async () => {
    fixture.componentRef.setInput("games", []);
    await fixture.whenStable();

    expect(element.querySelector(".no-game-found")?.textContent).toContain("Aucun jeu trouvé");
    expect(getGameDetails()).toHaveLength(0);
  });

  it("should not display the games when they cannot be displayed", async () => {
    fixture.componentRef.setInput("isGamesListDisplayed", false);
    await fixture.whenStable();

    expect(getGameDetails()).toHaveLength(0);
    expect(element.querySelector(".no-game-found")).toBeNull();
    expect(element.querySelector(".games-loading")).toBeNull();
    expect(element.querySelector(".search-game-form")).not.toBeNull();
    expect(element.querySelector("mat-paginator")).not.toBeNull();
  });

  it("should give their achievements and their loading state to the games", async () => {
    fixture.componentRef.setInput("achievementsByAppId", { 220: achievements });
    fixture.componentRef.setInput("loadingAchievementsAppIds", new Set(["340"]));
    await fixture.whenStable();

    const [firstGame, secondGame] = getGameDetailsComponents();
    expect(firstGame.achievements()).toEqual(achievements);
    expect(firstGame.isLoading()).toBe(false);
    expect(secondGame.achievements()).toBeUndefined();
    expect(secondGame.isLoading()).toBe(true);
  });

  it("should emit the appid of the game whose panel is opened", async () => {
    const achievementsRequestedSpy = vi.fn();
    fixture.componentInstance.achievementsRequested.subscribe(achievementsRequestedSpy);

    getGameDetails()[1].querySelector<HTMLElement>("mat-expansion-panel-header")!.click();
    await fixture.whenStable();
    expect(achievementsRequestedSpy).toHaveBeenCalledExactlyOnceWith("340");
  });

  it("should emit the selected page", () => {
    const pageChangedSpy = vi.fn();
    fixture.componentInstance.pageChanged.subscribe(pageChangedSpy);

    element.querySelector<HTMLButtonElement>(".mat-mdc-paginator-navigation-next")!.click();
    expect(pageChangedSpy).toHaveBeenCalledExactlyOnceWith(1);
  });

  it("should emit the typed search", () => {
    const searchChangedSpy = vi.fn();
    fixture.componentInstance.searchChanged.subscribe(searchChangedSpy);

    const searchInput = element.querySelector<HTMLInputElement>(".search-game-form input")!;
    searchInput.value = "Lost";
    searchInput.dispatchEvent(new Event("input"));
    expect(searchChangedSpy).toHaveBeenCalledExactlyOnceWith("Lost");
  });

  it("should display the search, and emit its reset", async () => {
    const searchResetSpy = vi.fn();
    fixture.componentInstance.searchReset.subscribe(searchResetSpy);
    fixture.componentRef.setInput("searchQuery", "Lost");
    await fixture.whenStable();

    expect(element.querySelector<HTMLInputElement>(".search-game-form input")!.value).toEqual(
      "Lost"
    );
    const resetButton = element.querySelector<HTMLButtonElement>(".reset-form-button")!;
    expect(resetButton.getAttribute("aria-label")).toEqual("Annuler la recherche");
    resetButton.click();
    expect(searchResetSpy).toHaveBeenCalledOnce();
  });

  it("should not reload the page when the search is submitted", () => {
    const submitEvent = new Event("submit", { cancelable: true });
    element.querySelector(".search-game-form")!.dispatchEvent(submitEvent);
    expect(submitEvent.defaultPrevented).toBe(true);
  });
});

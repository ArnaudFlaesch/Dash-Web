import { WIDGET_DATA, WIDGET_ID } from "@widgets/widget-tokens";

import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { vi } from "vitest";
import { Page } from "@shared/pagination/page";
import { environment } from "@environments/environment";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { GameInfoResponse, PlayerDataResponse } from "./steam";
import { SteamWidget } from "./steam-widget";
import { GameDetails } from "./game-details/game-details";
import { provideHttpClient } from "@angular/common/http";

describe("SteamWidget", () => {
  const steamUserId = "1337";
  const playerDataUrl = `${environment.backend_url}/steamWidget/playerData?steamUserId=${steamUserId}`;
  const ownedGamesUrl = `${environment.backend_url}/steamWidget/ownedGames?steamUserId=${steamUserId}`;
  const updateWidgetUrl = `${environment.backend_url}/widget/updateWidgetData/1`;
  const ERROR_GETTING_PLAYER_DATA = "Erreur lors de la récupération de vos informations Steam.";
  const ERROR_GETTING_OWNED_GAMES = "Erreur lors de la récupération de la liste des jeux.";
  const player: PlayerDataResponse = {
    personaname: "Nono",
    profileurl: "https://steamcommunity.com/id/Nauno93/",
    avatar: "https://steamcdn.example/avatar.jpg"
  };
  const games: Page<GameInfoResponse> = {
    totalElements: 30,
    content: [
      { appid: "220", name: "Half-Life 2", imgIconUrl: "icon220", imgLogoUrl: "logo220" },
      { appid: "340", name: "Half-Life 2: Lost Coast", imgIconUrl: "icon340", imgLogoUrl: "logo" }
    ],
    totalPages: 2,
    last: false,
    size: 25,
    number: 0
  };

  let fixture: ComponentFixture<SteamWidget>;
  let element: HTMLElement;
  let httpTestingController: HttpTestingController;
  let handleErrorSpy: ReturnType<typeof vi.spyOn>;

  async function createWidget(widgetData?: Record<string, unknown>): Promise<void> {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: 1 },
        ...(widgetData ? [{ provide: WIDGET_DATA, useValue: widgetData }] : [])
      ]
    }).compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
    handleErrorSpy = vi
      .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
      .mockImplementation(() => undefined);
    fixture = TestBed.createComponent(SteamWidget);
    element = fixture.nativeElement as HTMLElement;
    TestBed.tick();
  }

  /** Creates the widget of the saved Steam user, and answers its requests. */
  async function createLoadedWidget(ownedGames: Page<GameInfoResponse>): Promise<void> {
    await createWidget({ steamUserId });
    httpTestingController.expectOne(playerDataUrl).flush([player]);
    httpTestingController.expectOne(ownedGamesUrl).flush(ownedGames);
    await renderResponses();
  }

  afterEach(() => {
    httpTestingController.verify();
    vi.useRealTimers();
  });

  /** Lets the resources receive the flushed responses, then load the requests depending on them. */
  async function flushResources(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  /** Lets the resources receive the flushed responses, then renders them. */
  async function renderResponses(): Promise<void> {
    await flushResources();
    await fixture.whenStable();
  }

  function getGameDetails(): NodeListOf<HTMLElement> {
    return element.querySelectorAll("dash-game-details");
  }

  function getPaginatorRange(): string | undefined {
    return element.querySelector(".mat-mdc-paginator-range-label")?.textContent?.trim();
  }

  function goToNextPage(): void {
    element.querySelector<HTMLButtonElement>(".mat-mdc-paginator-navigation-next")!.click();
    TestBed.tick();
  }

  it("should display the configuration form without saved Steam user", async () => {
    await createWidget();
    await fixture.whenStable();

    expect(element.querySelector("#steam-user-id-label")?.textContent).toContain(
      "Utilisateur Steam"
    );
    const input = element.querySelector<HTMLInputElement>("#steam-user-id-input")!;
    expect(input.placeholder).toEqual("Saisissez l'ID utilisateur du joueur Steam");
    expect(element.querySelector<HTMLButtonElement>(".validate-button")!.disabled).toBe(true);
    httpTestingController.expectNone(() => true);
  });

  it("should not load anything without Steam user", async () => {
    await createWidget();
    await fixture.whenStable();

    // Even if the widget asks for a refresh
    fixture.debugElement.query(By.css("dash-widget")).triggerEventHandler("refreshWidgetAction");
    await fixture.whenStable();
    httpTestingController.expectNone(() => true);
    // The configuration form is still displayed, without player nor games
    expect(element.querySelector("#steam-user-id-input")).toBeTruthy();
    expect(element.querySelector("dash-game-details")).toBeNull();
  });

  it("should save the typed Steam user, then load its player and games", async () => {
    await createWidget();
    await fixture.whenStable();

    const input = element.querySelector<HTMLInputElement>("#steam-user-id-input")!;
    input.value = steamUserId;
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();
    const validateButton = element.querySelector<HTMLButtonElement>(".validate-button")!;
    expect(validateButton.disabled).toBe(false);

    validateButton.click();
    const saveRequest = httpTestingController.expectOne(updateWidgetUrl);
    expect(saveRequest.request.body).toEqual({ data: { steamUserId } });
    saveRequest.flush({});
    TestBed.tick();
    httpTestingController.expectOne(playerDataUrl).flush([player]);
    httpTestingController.expectOne(ownedGamesUrl).flush(games);
    await renderResponses();

    expect(element.querySelector(".widget-header")?.textContent).toContain(player.personaname);
    expect(getGameDetails()).toHaveLength(2);
  });

  it("should display a spinner until the games are loaded", async () => {
    await createWidget({ steamUserId });
    httpTestingController.expectOne(playerDataUrl).flush([player]);
    await flushResources();
    expect(element.querySelector(".games-loading")).not.toBeNull();

    httpTestingController.expectOne(ownedGamesUrl).flush(games);
    await renderResponses();
    expect(element.querySelector(".games-loading")).toBeNull();
    expect(getGameDetails()).toHaveLength(2);
  });

  it("should display the player and the games", async () => {
    await createLoadedWidget(games);

    const headerLinks = element.querySelectorAll<HTMLAnchorElement>("a.steam-header");
    expect(headerLinks).toHaveLength(2);
    expect(headerLinks[0].getAttribute("href")).toEqual(player.profileurl);
    const avatar = headerLinks[0].querySelector<HTMLImageElement>("img")!;
    expect(avatar.src).toEqual(player.avatar);
    expect(avatar.alt).toEqual(player.personaname);
    expect(headerLinks[1].textContent).toContain(player.personaname);

    const gameDetails = getGameDetails();
    expect(gameDetails).toHaveLength(2);
    expect(gameDetails[0].textContent).toContain("Half-Life 2");
    expect(gameDetails[1].textContent).toContain("Half-Life 2: Lost Coast");
    expect(element.querySelector(".no-game-found")).toBeNull();
    expect(element.querySelector(".search-game-form mat-label")?.textContent).toContain(
      "Recherchez un jeu"
    );
    expect(getPaginatorRange()).toContain("30");
    expect(element.querySelector("mat-paginator")?.getAttribute("aria-label")).toEqual(
      "Sélectionnez une page"
    );
  });

  it("should give the links of the games to their details, even when the player is received after the games", async () => {
    await createWidget({ steamUserId });
    const playerDataRequest = httpTestingController.expectOne(playerDataUrl);
    httpTestingController.expectOne(ownedGamesUrl).flush(games);
    await flushResources();
    playerDataRequest.flush([player]);
    await renderResponses();

    const gameDetails = fixture.debugElement.query(By.directive(GameDetails))
      .componentInstance as GameDetails;
    expect(gameDetails.steamUserId()).toEqual(steamUserId);
    expect(gameDetails.gameInfo()).toEqual({
      ...games.content[0],
      appIdLink: "https://steamcommunity.com/app/220",
      playerAchievementUrl: "https://steamcommunity.com/id/Nauno93/stats/220/achievements/",
      gameImgSrc:
        "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/220/icon220.jpg"
    });
  });

  it("should display a message when no game is found", async () => {
    await createLoadedWidget({ ...games, totalElements: 0, content: [] });

    expect(element.querySelector(".no-game-found")?.textContent).toContain("Aucun jeu trouvé");
    expect(element.querySelector("dash-game-details")).toBeNull();
  });

  it("should load the next page of games from the paginator", async () => {
    await createLoadedWidget(games);

    goToNextPage();
    // The spinner is displayed until the page is received
    expect(element.querySelector(".games-loading")).not.toBeNull();
    httpTestingController
      .expectOne(`${ownedGamesUrl}&pageNumber=1`)
      .flush({ ...games, content: [games.content[0]], number: 1 });
    await renderResponses();

    expect(element.querySelector(".games-loading")).toBeNull();
    expect(getPaginatorRange()).toMatch(/^26\D+30\D+30$/);
    expect(getGameDetails()).toHaveLength(1);
  });

  it("should keep the page on a refresh, and go back to the first page for another user", async () => {
    await createLoadedWidget(games);
    goToNextPage();
    httpTestingController.expectOne(`${ownedGamesUrl}&pageNumber=1`).flush(games);
    await renderResponses();

    // Same user: the current page is reloaded
    element.querySelector<HTMLButtonElement>(".refresh-button")!.click();
    TestBed.tick();
    httpTestingController.expectOne(playerDataUrl).flush([player]);
    httpTestingController.expectOne(`${ownedGamesUrl}&pageNumber=1`).flush(games);
    await renderResponses();

    // Another user: the first page of its games is loaded
    element.querySelector<HTMLButtonElement>(".edit-button")!.click();
    await fixture.whenStable();
    const input = element.querySelector<HTMLInputElement>("#steam-user-id-input")!;
    input.value = "42";
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>(".validate-button")!.click();
    httpTestingController.expectOne(updateWidgetUrl).flush({});
    TestBed.tick();
    httpTestingController
      .expectOne(`${environment.backend_url}/steamWidget/playerData?steamUserId=42`)
      .flush([player]);
    httpTestingController
      .expectOne(`${environment.backend_url}/steamWidget/ownedGames?steamUserId=42`)
      .flush(games);
    await renderResponses();
    expect(getPaginatorRange()).toMatch(/^1\D+25\D+30$/);
  });

  it("should not reload the page when the search is submitted", async () => {
    await createLoadedWidget(games);
    const submitEvent = new Event("submit", { cancelable: true });
    element.querySelector(".search-game-form")!.dispatchEvent(submitEvent);
    expect(submitEvent.defaultPrevented).toBe(true);
  });

  it("should stop loading when the page navigation fails", async () => {
    await createLoadedWidget(games);

    goToNextPage();
    httpTestingController
      .expectOne(`${ownedGamesUrl}&pageNumber=1`)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await renderResponses();

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      ERROR_GETTING_OWNED_GAMES
    );
    expect(element.querySelector(".games-loading")).toBeNull();
    expect(getGameDetails()).toHaveLength(0);
  });

  it("should search the games from the first page, then cancel the search", async () => {
    // Only the timers of the search debounce are faked
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    await createLoadedWidget(games);
    goToNextPage();
    httpTestingController.expectOne(`${ownedGamesUrl}&pageNumber=1`).flush(games);
    await renderResponses();
    expect(element.querySelector(".reset-form-button")).toBeNull();

    const searchInput = element.querySelector<HTMLInputElement>(".search-game-form input")!;
    searchInput.value = "Lost";
    searchInput.dispatchEvent(new Event("input"));
    TestBed.tick();
    // The search is debounced
    httpTestingController.expectNone((request) => request.url.endsWith("/ownedGames"));
    vi.advanceTimersByTime(500);
    TestBed.tick();
    // Back to the first page, without page number
    httpTestingController
      .expectOne(`${ownedGamesUrl}&search=Lost`)
      .flush({ ...games, totalElements: 1, content: [games.content[1]] });
    await renderResponses();
    expect(getGameDetails()).toHaveLength(1);
    expect(getPaginatorRange()).toMatch(/^1\D+1\D+1$/);

    const resetButton = element.querySelector<HTMLButtonElement>(".reset-form-button")!;
    expect(resetButton).not.toBeNull();
    expect(resetButton.getAttribute("aria-label")).toEqual("Annuler la recherche");
    resetButton.click();
    TestBed.tick();
    expect(searchInput.value).toEqual("");
    expect(element.querySelector(".reset-form-button")).toBeNull();
    vi.advanceTimersByTime(500);
    TestBed.tick();
    httpTestingController.expectOne(ownedGamesUrl).flush(games);
    await renderResponses();
    expect(getGameDetails()).toHaveLength(2);
  });

  it("should not display the games without player", async () => {
    await createWidget({ steamUserId });
    httpTestingController
      .expectOne(playerDataUrl)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    httpTestingController.expectOne(ownedGamesUrl).flush(games);
    await renderResponses();

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      ERROR_GETTING_PLAYER_DATA
    );
    // So the links to the achievements, which need the profile of the player, are never displayed
    expect(element.querySelector("dash-game-details")).toBeNull();
    expect(element.querySelector(".no-game-found")).toBeNull();
    expect(element.querySelector("a.steam-header img")).toBeNull();
    expect(element.querySelector("a.steam-header")?.getAttribute("href")).toEqual("");
  });

  it("should not display the games of an unknown player", async () => {
    await createWidget({ steamUserId });
    httpTestingController.expectOne(playerDataUrl).flush([]);
    httpTestingController.expectOne(ownedGamesUrl).flush(games);
    await renderResponses();

    expect(element.querySelector("a.steam-header img")).toBeNull();
    expect(element.querySelector("a.steam-header")?.textContent?.trim()).toEqual("");
    expect(element.querySelector("dash-game-details")).toBeNull();
  });

  it("Should restore the saved configuration when the edition is cancelled", async () => {
    await createLoadedWidget(games);

    const openEdition = async (): Promise<void> => {
      element.querySelector<HTMLElement>(".edit-button")!.click();
      await fixture.whenStable();
    };
    await openEdition();
    const input = element.querySelector<HTMLInputElement>("#steam-user-id-input")!;
    input.value = "42";
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();

    element.querySelector<HTMLElement>(".cancel-button")!.click();
    await fixture.whenStable();
    await openEdition();
    expect(element.querySelector<HTMLInputElement>("#steam-user-id-input")!.value).toEqual(
      steamUserId
    );
  });
});

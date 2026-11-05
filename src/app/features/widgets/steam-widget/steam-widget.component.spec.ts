import { WIDGET_DATA, WIDGET_ID } from "@widgets/widget.tokens";
import { PageEvent } from "@angular/material/paginator";

import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { IPage } from "@shared/models/page.model";
import { environment } from "@environments/environment";
import { ErrorHandlerService } from "@core/error-handler/error-handler.service";
import { IGameInfoResponse, IPlayerDataResponse } from "./steam.model";
import { SteamWidgetComponent } from "./steam-widget.component";
import { provideHttpClient } from "@angular/common/http";

describe("SteamWidgetComponent", () => {
  let component: SteamWidgetComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: 1 }
      ]
    })
      // Not rendered, so that the resources are only loaded by the test, not by the child components
      .overrideTemplate(SteamWidgetComponent, "")
      .compileComponents();

    const fixture = TestBed.createComponent(SteamWidgetComponent);
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

  const playerData: IPlayerDataResponse[] = [
    {
      personaname: "Nono",
      profileurl: "https://steamcommunity.com/id/Nauno93/",
      avatar:
        "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/d1/d16c8dc08c0d3d71f7b7e47ba2b13e78418cd6d3.jpg"
    }
  ];
  const ownedGamesData: IPage<IGameInfoResponse> = {
    totalElements: 10,
    content: [
      {
        appid: "220",
        name: "Half-Life 2",
        imgIconUrl: "fcfb366051782b8ebf2aa297f3b746395858cb62",
        imgLogoUrl: "e4ad9cf1b7dc8475c1118625daf9abd4bdcbcad0"
      },
      {
        appid: "340",
        name: "Half-Life 2: Lost Coast",
        imgIconUrl: "795e85364189511f4990861b578084deef086cb1",
        imgLogoUrl: "867cce5c4f37d5ed4aeffb57c60e220ddffe4134"
      },
      {
        appid: "280",
        name: "Half-Life: Source",
        imgIconUrl: "b4f572a6cc5a6a84ae84634c31414b9123d2f26b",
        imgLogoUrl: "a612dd944b768e55389140298dcfda2165db8ced"
      }
    ],
    totalPages: 1,
    last: true,
    size: 3,
    number: 0
  };

  it("should create", async () => {
    expect(component.playerData()).toBeUndefined();
    expect(component.ownedGamesDisplay()).toEqual([]);
    const steamUserId = "1337";
    expect(component.isFormValid()).toEqual(false);
    component.config.update((config) => ({ ...config, steamUserId: steamUserId }));
    expect(component.isFormValid()).toEqual(true);
    component.refreshWidget();
    TestBed.tick();

    const playerDataRequest = httpTestingController.expectOne(
      `${environment.backend_url}/steamWidget/playerData?steamUserId=${steamUserId}`
    );
    playerDataRequest.flush(playerData);
    await flushResources();
    const getOwnedGamesRequest = httpTestingController.expectOne(
      `${environment.backend_url}/steamWidget/ownedGames?steamUserId=${steamUserId}`
    );
    getOwnedGamesRequest.flush(ownedGamesData);
    await flushResources();

    expect(component.playerData()?.personaname).toEqual(playerData[0].personaname);
    expect(component.ownedGamesDisplay()).toHaveLength(3);
  });

  it("Should load new data on page navigation and search", async () => {
    // Only the timers of the search debounce are faked
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    expect(component.ownedGamesDisplay()).toEqual([]);
    expect(component.pageNumber()).toEqual(0);
    const pageIndex = 2;
    const pageEvent = {
      pageIndex: pageIndex,
      pageSize: 25,
      length: 150
    } as PageEvent;
    component.onPageChanged(pageEvent);
    expect(component.pageNumber()).toEqual(0);

    const steamUserId = "1337";
    const ownedGamesUrl = `${environment.backend_url}/steamWidget/ownedGames?steamUserId=${steamUserId}`;
    component.config.update((config) => ({ ...config, steamUserId: steamUserId }));
    component.refreshWidget();
    TestBed.tick();
    httpTestingController
      .expectOne(`${environment.backend_url}/steamWidget/playerData?steamUserId=${steamUserId}`)
      .flush(playerData);
    await flushResources();
    httpTestingController.expectOne(ownedGamesUrl).flush(ownedGamesData);
    await flushResources();

    expect(component.isOwnedGamesLoading()).toEqual(false);
    component.onPageChanged(pageEvent);
    TestBed.tick();
    expect(component.pageNumber()).toEqual(pageIndex);
    // The spinner is displayed until the page is received
    expect(component.isOwnedGamesLoading()).toEqual(true);
    httpTestingController
      .expectOne(`${ownedGamesUrl}&pageNumber=${pageIndex}`)
      .flush(ownedGamesData);
    await flushResources();
    expect(component.isOwnedGamesLoading()).toEqual(false);

    // The search is debounced, then goes back to the first page
    const searchValue = "Mario";
    component.searchQuery.set(searchValue);
    TestBed.tick();
    httpTestingController.expectNone(`${ownedGamesUrl}&search=${searchValue}`);
    vi.advanceTimersByTime(500);
    TestBed.tick();
    expect(component.pageNumber()).toEqual(0);
    httpTestingController.expectOne(`${ownedGamesUrl}&search=${searchValue}`).flush(ownedGamesData);
    await flushResources();

    component.resetForm();
    expect(component.searchQuery()).toEqual("");
    vi.useRealTimers();
  });

  it("Should stop loading when the page navigation fails", async () => {
    const errorHandlerService = TestBed.inject(ErrorHandlerService);
    const handleErrorSpy = vi
      .spyOn(errorHandlerService, "handleError")
      .mockImplementation(() => undefined);
    const steamUserId = "1337";
    const ownedGamesUrl = `${environment.backend_url}/steamWidget/ownedGames?steamUserId=${steamUserId}`;
    component.config.update((config) => ({ ...config, steamUserId: steamUserId }));
    component.refreshWidget();
    TestBed.tick();
    httpTestingController
      .expectOne(`${environment.backend_url}/steamWidget/playerData?steamUserId=${steamUserId}`)
      .flush(playerData);
    await flushResources();
    httpTestingController.expectOne(ownedGamesUrl).flush(ownedGamesData);
    await flushResources();

    const pageIndex = 1;
    component.onPageChanged({ pageIndex: pageIndex, pageSize: 25, length: 150 } as PageEvent);
    TestBed.tick();
    expect(component.isOwnedGamesLoading()).toEqual(true);
    httpTestingController
      .expectOne(`${ownedGamesUrl}&pageNumber=${pageIndex}`)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await flushResources();

    expect(component.isOwnedGamesLoading()).toEqual(false);
    expect(handleErrorSpy).toHaveBeenCalled();
    expect(component.ownedGamesDisplay()).toEqual([]);
  });

  it("Should get widget data and check form", () => {
    expect(component.widgetData()).toBeUndefined();
    expect(component.isFormValid()).toEqual(false);
    const steamUserId = "1337";
    component.config.update((config) => ({ ...config, steamUserId: steamUserId }));
    expect(component.widgetData()).toEqual({
      steamUserId: steamUserId
    });
    expect(component.isFormValid()).toEqual(true);
  });

  it("Should not load anything without Steam user", () => {
    component.refreshWidget();
    TestBed.tick();
    httpTestingController.expectNone(() => true);
    expect(component.playerData()).toBeUndefined();
  });

  it("Should build the links of the games, even when the player is received after the games", async () => {
    const steamUserId = "1337";
    component.config.update((config) => ({ ...config, steamUserId: steamUserId }));
    component.refreshWidget();
    TestBed.tick();
    const playerDataRequest = httpTestingController.expectOne(
      `${environment.backend_url}/steamWidget/playerData?steamUserId=${steamUserId}`
    );
    httpTestingController
      .expectOne(`${environment.backend_url}/steamWidget/ownedGames?steamUserId=${steamUserId}`)
      .flush(ownedGamesData);
    await flushResources();
    playerDataRequest.flush(playerData);
    await flushResources();

    expect(component.ownedGamesDisplay()[0]).toEqual({
      ...ownedGamesData.content[0],
      appIdLink: "https://steamcommunity.com/app/220",
      playerAchievementUrl: "https://steamcommunity.com/id/Nauno93/stats/220/achievements/",
      gameImgSrc:
        "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/220/fcfb366051782b8ebf2aa297f3b746395858cb62.jpg"
    });
  });

  it("Should handle the error when getting the player", async () => {
    const handleErrorSpy = vi
      .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
      .mockImplementation(() => undefined);
    const steamUserId = "1337";
    component.config.update((config) => ({ ...config, steamUserId: steamUserId }));
    component.refreshWidget();
    TestBed.tick();
    httpTestingController
      .expectOne(`${environment.backend_url}/steamWidget/playerData?steamUserId=${steamUserId}`)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    httpTestingController
      .expectOne(`${environment.backend_url}/steamWidget/ownedGames?steamUserId=${steamUserId}`)
      .flush(ownedGamesData);
    await flushResources();

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la récupération de vos informations Steam."
    );
    expect(component.playerData()).toBeUndefined();
  });
});

describe("SteamWidgetComponent rendering", () => {
  const steamUserId = "1337";
  const playerDataUrl = `${environment.backend_url}/steamWidget/playerData?steamUserId=${steamUserId}`;
  const ownedGamesUrl = `${environment.backend_url}/steamWidget/ownedGames?steamUserId=${steamUserId}`;
  const player: IPlayerDataResponse = {
    personaname: "Nono",
    profileurl: "https://steamcommunity.com/id/Nauno93/",
    avatar: "https://steamcdn.example/avatar.jpg"
  };
  const games: IPage<IGameInfoResponse> = {
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

  let fixture: ComponentFixture<SteamWidgetComponent>;
  let component: SteamWidgetComponent;
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
    fixture = TestBed.createComponent(SteamWidgetComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    TestBed.tick();
  }

  /** Creates the widget of the saved Steam user, and answers its requests. */
  async function createLoadedWidget(ownedGames: IPage<IGameInfoResponse>): Promise<void> {
    await createWidget({ steamUserId });
    httpTestingController.expectOne(playerDataUrl).flush([player]);
    httpTestingController.expectOne(ownedGamesUrl).flush(ownedGames);
    await flushResources();
    await fixture.whenStable();
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

  it("should display the configuration form without saved Steam user", async () => {
    await createWidget();
    await fixture.whenStable();

    expect(element.querySelector("#steam-user-id-label")?.textContent).toContain(
      component.labels.steamUser
    );
    const input = element.querySelector("#steam-user-id-input") as HTMLInputElement;
    expect(input.placeholder).toEqual(component.labels.enterSteamUserId);
    httpTestingController.expectNone(() => true);

    input.value = steamUserId;
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();
    expect(component.widgetData()).toEqual({ steamUserId });
  });

  it("should display a spinner until the games are loaded", async () => {
    await createWidget({ steamUserId });
    httpTestingController.expectOne(playerDataUrl).flush([player]);
    await flushResources();
    expect(element.querySelector(".games-loading")).not.toBeNull();

    httpTestingController.expectOne(ownedGamesUrl).flush(games);
    await flushResources();
    await fixture.whenStable();
    expect(element.querySelector(".games-loading")).toBeNull();
    expect(element.querySelectorAll("dash-game-details")).toHaveLength(2);
  });

  it("should display the player and the games", async () => {
    await createLoadedWidget(games);

    const headerLinks = element.querySelectorAll<HTMLAnchorElement>("a.steam-header");
    expect(headerLinks).toHaveLength(2);
    expect(headerLinks[0].getAttribute("href")).toEqual(player.profileurl);
    const avatar = headerLinks[0].querySelector("img") as HTMLImageElement;
    expect(avatar.src).toEqual(player.avatar);
    expect(avatar.alt).toEqual(player.personaname);
    expect(headerLinks[1].textContent).toContain(player.personaname);

    const gameDetails = element.querySelectorAll("dash-game-details");
    expect(gameDetails).toHaveLength(2);
    expect(gameDetails[0].textContent).toContain("Half-Life 2");
    expect(gameDetails[1].textContent).toContain("Half-Life 2: Lost Coast");
    expect(element.querySelector(".no-game-found")).toBeNull();
    expect(element.querySelector(".mat-mdc-paginator-range-label")?.textContent).toContain("30");
    expect(element.querySelector("mat-paginator")?.getAttribute("aria-label")).toEqual(
      component.labels.selectPage
    );
  });

  it("should display a message when no game is found", async () => {
    await createLoadedWidget({ ...games, totalElements: 0, content: [] });

    expect(element.querySelector(".no-game-found")?.textContent).toContain(
      component.labels.noGameFound
    );
    expect(element.querySelector("dash-game-details")).toBeNull();
  });

  it("should load the next page of games from the paginator", async () => {
    await createLoadedWidget(games);

    (element.querySelector(".mat-mdc-paginator-navigation-next") as HTMLButtonElement).click();
    TestBed.tick();
    httpTestingController
      .expectOne(`${ownedGamesUrl}&pageNumber=1`)
      .flush({ ...games, content: [games.content[0]], number: 1 });
    await flushResources();
    await fixture.whenStable();

    expect(component.pageNumber()).toEqual(1);
    expect(element.querySelectorAll("dash-game-details")).toHaveLength(1);
  });

  it("should search the games, then cancel the search", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    await createLoadedWidget(games);
    expect(element.querySelector("#reset-form-button")).toBeNull();

    const searchInput = element.querySelector("#search-game-form input") as HTMLInputElement;
    searchInput.value = "Lost";
    searchInput.dispatchEvent(new Event("input"));
    TestBed.tick();
    vi.advanceTimersByTime(500);
    TestBed.tick();
    httpTestingController
      .expectOne(`${ownedGamesUrl}&search=Lost`)
      .flush({ ...games, totalElements: 1, content: [games.content[1]] });
    await flushResources();
    await fixture.whenStable();
    expect(element.querySelectorAll("dash-game-details")).toHaveLength(1);

    const resetButton = element.querySelector("#reset-form-button") as HTMLButtonElement;
    expect(resetButton).not.toBeNull();
    resetButton.click();
    TestBed.tick();
    expect(searchInput.value).toEqual("");
    expect(element.querySelector("#reset-form-button")).toBeNull();
    vi.advanceTimersByTime(500);
    TestBed.tick();
    httpTestingController.expectOne(ownedGamesUrl).flush(games);
    await flushResources();
    await fixture.whenStable();
    expect(element.querySelectorAll("dash-game-details")).toHaveLength(2);
  });

  it("should not display the games without player", async () => {
    await createWidget({ steamUserId });
    httpTestingController
      .expectOne(playerDataUrl)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    httpTestingController.expectOne(ownedGamesUrl).flush(games);
    await flushResources();
    await fixture.whenStable();

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la récupération de vos informations Steam."
    );
    // So the links to the achievements, which need the profile of the player, are never displayed
    expect(element.querySelector("dash-game-details")).toBeNull();
    expect(element.querySelector(".no-game-found")).toBeNull();
    expect(element.querySelector("a.steam-header")?.getAttribute("href")).toEqual("");
  });

  it("should not display the games of an unknown player", async () => {
    await createWidget({ steamUserId });
    httpTestingController.expectOne(playerDataUrl).flush([]);
    httpTestingController.expectOne(ownedGamesUrl).flush(games);
    await flushResources();
    await fixture.whenStable();

    expect(component.playerData()).toBeUndefined();
    expect(element.querySelector("dash-game-details")).toBeNull();
  });
});

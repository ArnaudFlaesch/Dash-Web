import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ErrorHandlerService } from "../../../services/error.handler.service";
import { IGameInfoDisplay } from "../ISteam";
import { SteamWidgetService } from "../steam.widget.service";
import { environment } from "../../../../environments/environment";
import { GameDetailsComponent } from "./game-details.component";
import { provideHttpClient } from "@angular/common/http";
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

import { Activity } from "../strava";

import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StravaActivities } from "./strava-activities";

describe("StravaActivities", () => {
  let fixture: ComponentFixture<StravaActivities>;

  const activitiesData: Activity[] = [
    {
      resourceState: 2,
      athlete: { id: 25345795, resourceState: 0 },
      name: "Evening Run",
      distance: 10704.7,
      movingTime: 2958,
      elapsedTime: 3118,
      totalElevationGain: 49.2,
      type: "Run",
      workoutType: 0,
      id: 7.993416249e9,
      externalId: "ad38998a-3d06-41ee-9e9d-b6bb7c143edf-activity.fit",
      uploadId: 8550990828,
      startDate: "2022-10-20T16:34:39Z",
      startDateLocal: "2022-10-20T18:34:39Z",
      timezone: "(GMT+01:00) Europe/Paris",
      utcOffset: 7200.0,
      startLatlng: [48.8566, 2.3522],
      endLatlng: [48.8566, 2.3522],
      locationCity: undefined,
      locationState: undefined,
      locationCountry: "France",
      startLatitude: 0,
      startLongitude: 0,
      achievementCount: 1,
      kudosCount: 2,
      commentCount: 0,
      athleteCount: 1,
      photoCount: 0,
      map: { id: "a7993416249", summaryPolyline: "", resourceState: 0 },
      trainer: false,
      commute: false,
      manual: false,
      private: false,
      visibility: "everyone",
      flagged: false,
      gearId: "g11571174",
      fromAcceptedTag: false,
      uploadIdStr: "8550990828",
      averageSpeed: 3.619,
      maxSpeed: 16.919,
      hasHeartrate: false,
      heartrateOptOut: false,
      displayHideHeartrateOption: false,
      elevHigh: 57.0,
      elevLow: 34.6,
      prCount: 0,
      totalPhotoCount: 0,
      hasKudoed: false
    },
    {
      resourceState: 2,
      athlete: { id: 25345795, resourceState: 0 },
      name: "Evening Run",
      distance: 12397.6,
      movingTime: 2611,
      elapsedTime: 2916,
      totalElevationGain: 102.2,
      type: "Run",
      workoutType: 0,
      id: 7.978046184e9,
      externalId: "55bbcb3c-6b6c-4e5e-9ddd-310a03a7e0a4-activity.fit",
      uploadId: 8533704724,
      startDate: "2022-10-17T16:12:50Z",
      startDateLocal: "2022-10-17T18:12:50Z",
      timezone: "(GMT+01:00) Europe/Paris",
      utcOffset: 7200.0,
      startLatlng: [48.8566, 2.3522],
      endLatlng: [48.8566, 2.3522],
      locationCity: undefined,
      locationState: undefined,
      locationCountry: "France",
      startLatitude: 0,
      startLongitude: 0,
      achievementCount: 0,
      kudosCount: 0,
      commentCount: 0,
      athleteCount: 1,
      photoCount: 0,
      map: { id: "a7978046184", summaryPolyline: "", resourceState: 0 },
      trainer: false,
      commute: false,
      manual: false,
      private: false,
      visibility: "everyone",
      flagged: false,
      gearId: "g11571174",
      fromAcceptedTag: false,
      uploadIdStr: "8533704724",
      averageSpeed: 4.748,
      maxSpeed: 25.746,
      hasHeartrate: false,
      heartrateOptOut: false,
      displayHideHeartrateOption: false,
      elevHigh: 60.1,
      elevLow: 28.1,
      prCount: 0,
      totalPhotoCount: 0,
      hasKudoed: false
    },
    {
      resourceState: 2,
      athlete: { id: 25345795, resourceState: 0 },
      name: "Lunch Run",
      distance: 10529.8,
      movingTime: 2397,
      elapsedTime: 2489,
      totalElevationGain: 63.6,
      type: "Run",
      workoutType: 0,
      id: 7.935092006e9,
      externalId: "fb87134a-6899-4de5-899d-52e268350771-activity.fit",
      uploadId: 8484120451,
      startDate: "2022-10-09T09:44:01Z",
      startDateLocal: "2022-10-09T11:44:01Z",
      timezone: "(GMT+01:00) Europe/Paris",
      utcOffset: 7200.0,
      startLatlng: [48.8566, 2.3522],
      endLatlng: [48.8566, 2.3522],
      locationCity: undefined,
      locationState: undefined,
      locationCountry: "France",
      startLatitude: 0,
      startLongitude: 0,
      achievementCount: 0,
      kudosCount: 1,
      commentCount: 0,
      athleteCount: 1,
      photoCount: 0,
      map: { id: "a7935092006", summaryPolyline: "", resourceState: 0 },
      trainer: false,
      commute: false,
      manual: false,
      private: false,
      visibility: "everyone",
      flagged: false,
      gearId: "g11571174",
      fromAcceptedTag: false,
      uploadIdStr: "8484120451",
      averageSpeed: 4.393,
      maxSpeed: 27.142,
      hasHeartrate: false,
      heartrateOptOut: false,
      displayHideHeartrateOption: false,
      elevHigh: 52.7,
      elevLow: 31.6,
      prCount: 0,
      totalPhotoCount: 0,
      hasKudoed: false
    },
    {
      resourceState: 2,
      athlete: { id: 25345795, resourceState: 0 },
      name: "Afternoon Run",
      distance: 11666.4,
      movingTime: 2331,
      elapsedTime: 2555,
      totalElevationGain: 101.5,
      type: "Run",
      workoutType: 0,
      id: 7.849958186e9,
      externalId: "a03d0c6a-47dd-49e7-93dc-3e82316376e7-activity.fit",
      uploadId: 8388107116,
      startDate: "2022-09-22T15:31:15Z",
      startDateLocal: "2022-09-22T17:31:15Z",
      timezone: "(GMT+01:00) Europe/Paris",
      utcOffset: 7200.0,
      startLatlng: [48.8566, 2.3522],
      endLatlng: [48.8566, 2.3522],
      locationCity: undefined,
      locationState: undefined,
      locationCountry: "France",
      startLatitude: 0,
      startLongitude: 0,
      achievementCount: 0,
      kudosCount: 0,
      commentCount: 0,
      athleteCount: 1,
      photoCount: 0,
      map: { id: "a7849958186", summaryPolyline: "", resourceState: 0 },
      trainer: false,
      commute: false,
      manual: false,
      private: false,
      visibility: "everyone",
      flagged: false,
      gearId: "g2726529",
      fromAcceptedTag: false,
      uploadIdStr: "8388107116",
      averageSpeed: 5.005,
      maxSpeed: 36.188,
      hasHeartrate: false,
      heartrateOptOut: false,
      displayHideHeartrateOption: false,
      elevHigh: 52.7,
      elevLow: 29.8,
      prCount: 0,
      totalPhotoCount: 0,
      hasKudoed: false
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: []
    }).compileComponents();

    fixture = TestBed.createComponent(StravaActivities);
  });

  /** Opens the panel of each displayed activity, to display its details. */
  async function openPanels(): Promise<void> {
    const element = fixture.nativeElement as HTMLElement;
    element
      .querySelectorAll<HTMLElement>("mat-expansion-panel-header")
      .forEach((header) => header.click());
    await fixture.whenStable();
  }

  function getStats(panel: Element): { label?: string; value?: string }[] {
    return Array.from(panel.querySelectorAll(".activity-stat")).map((stat) => ({
      label: stat.querySelector(".activity-stat-label")?.textContent?.trim(),
      value: stat.querySelector(".activity-stat-value")?.textContent?.trim()
    }));
  }

  it("Should display the icon of each type of activity", async () => {
    fixture.componentRef.setInput("activities", [
      { ...activitiesData[0], id: 1, type: "Ride" },
      { ...activitiesData[0], id: 2, type: "Swim" },
      { ...activitiesData[0], id: 3, type: "Hike" },
      // Unknown type of activity
      { ...activitiesData[0], id: 4, type: "Yoga" }
    ]);
    await fixture.whenStable();
    const icons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(".activity-type-icon")
    ).map((icon) => icon.textContent?.trim());
    expect(icons).toEqual(["directions_bike", "pool", "hiking", "fitness_center"]);
  });

  it("Should format the duration, the distance and the speeds of an activity", async () => {
    fixture.componentRef.setInput("activities", [
      // 42 minutes, 5 m/s
      { ...activitiesData[0], id: 1, movingTime: 2520, averageSpeed: 5, distance: 10529.8 },
      // 1 hour and 5 minutes
      { ...activitiesData[0], id: 2, movingTime: 3900 }
    ]);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const metas = Array.from(element.querySelectorAll(".activity-meta")).map((meta) =>
      meta.textContent?.replaceAll(/\s+/g, " ").trim()
    );
    expect(metas).toEqual(["20 octobre · 10.5 km · 42 min", "20 octobre · 10.7 km · 1 h 05"]);

    await openPanels();
    const panels = element.querySelectorAll(".strava-activity");
    expect(getStats(panels[0])).toEqual(
      expect.arrayContaining([
        { label: "Distance", value: "10.53 km" },
        { label: "Durée", value: "42 min" },
        { label: "Vitesse moy.", value: "18 km/h" }
      ])
    );
    expect(getStats(panels[1])).toEqual(
      expect.arrayContaining([{ label: "Durée", value: "1 h 05" }])
    );
  });

  it("Should display a panel for each activity", async () => {
    fixture.componentRef.setInput("activities", activitiesData);
    await fixture.whenStable();
    const panels = (fixture.nativeElement as HTMLElement).querySelectorAll(".strava-activity");
    expect(panels).toHaveLength(activitiesData.length);
  });

  it("Should display the summary of each activity", async () => {
    fixture.componentRef.setInput("activities", [
      activitiesData[0],
      { ...activitiesData[1], id: 1, type: "Ride", name: "Morning Ride" }
    ]);
    await fixture.whenStable();
    const panels = (fixture.nativeElement as HTMLElement).querySelectorAll(".strava-activity");

    expect(panels[0].querySelector(".activity-type-icon")?.textContent).toContain("directions_run");
    expect(panels[0].querySelector(".activity-name")?.textContent).toContain("Evening Run");
    const meta = panels[0].querySelector(".activity-meta")?.textContent;
    expect(meta).toContain("20 octobre");
    expect(meta).toContain(`10.7 km`);
    expect(meta).toContain("49 min");
    expect(panels[1].querySelector(".activity-type-icon")?.textContent).toContain(
      "directions_bike"
    );
    expect(panels[1].querySelector(".activity-name")?.textContent).toContain("Morning Ride");
    // The details are only displayed once the panel is opened
    expect(panels[0].querySelector(".activity-stats")).toBeNull();
  });

  it("Should display the details of an activity once its panel is opened", async () => {
    fixture.componentRef.setInput("activities", [activitiesData[0]]);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    await openPanels();

    expect(getStats(element)).toEqual([
      { label: "Distance", value: `10.7 km` },
      { label: "Durée", value: "49 min" },
      { label: "Dénivelé", value: `49 m` },
      {
        label: "Vitesse moy.",
        value: `13 km/h`
      },
      {
        label: "Vitesse max",
        value: `60.9 km/h`
      },
      { label: "Trophées", value: "1" },
      { label: "Kudos", value: "2" },
      { label: "Commentaires", value: "0" }
    ]);
    const link = element.querySelector<HTMLAnchorElement>(".activity-link")!;
    expect(link.getAttribute("href")).toEqual(
      `https://www.strava.com/activities/${activitiesData[0].id}`
    );
    expect(link.textContent).toContain("Voir sur Strava");
  });
});

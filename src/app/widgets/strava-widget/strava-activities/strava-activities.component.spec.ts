import { IActivity } from "../IStrava";

import { TestBed } from "@angular/core/testing";
import { StravaActivitiesComponent } from "./strava-activities.component";

describe("StravaActivitiesComponent", () => {
  let component: StravaActivitiesComponent;

  const activitiesData: IActivity[] = [
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
      uploadId: 8.550990828e9,
      startDate: "2022-10-20T16:34:39Z",
      startDateLocal: "2022-10-20T18:34:39Z",
      timezone: "(GMT+01:00) Europe/Paris",
      utcOffset: 7200.0,
      startLatlng: [48, 2],
      endLatlng: [48, 2],
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
      uploadIdStr: 8.550990828e9,
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
      uploadId: 8.533704724e9,
      startDate: "2022-10-17T16:12:50Z",
      startDateLocal: "2022-10-17T18:12:50Z",
      timezone: "(GMT+01:00) Europe/Paris",
      utcOffset: 7200.0,
      startLatlng: [48, 2],
      endLatlng: [48, 2],
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
      uploadIdStr: 8.533704724e9,
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
      uploadId: 8.484120451e9,
      startDate: "2022-10-09T09:44:01Z",
      startDateLocal: "2022-10-09T11:44:01Z",
      timezone: "(GMT+01:00) Europe/Paris",
      utcOffset: 7200.0,
      startLatlng: [48, 2],
      endLatlng: [48, 2],
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
      uploadIdStr: 8.484120451e9,
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
      uploadId: 8.388107116e9,
      startDate: "2022-09-22T15:31:15Z",
      startDateLocal: "2022-09-22T17:31:15Z",
      timezone: "(GMT+01:00) Europe/Paris",
      utcOffset: 7200.0,
      startLatlng: [48, 2],
      endLatlng: [48, 2],
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
      uploadIdStr: 8.388107116e9,
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
      imports: [],
      providers: []
    }).compileComponents();

    const fixture = TestBed.createComponent(StravaActivitiesComponent);
    component = fixture.componentInstance;
  });

  it("Should convert a time", () => {
    component.activities = activitiesData;
    expect(component.convertDecimalTimeToTime(60000)).toEqual(1000);
    expect(component.convertDecimalTimeToTime(620.4)).toEqual(10.2);
    expect(component.convertDecimalTimeToTime(108)).toEqual(1.5);
    expect(component.convertDecimalTimeToTime(111)).toEqual(1.5);
  });

  it("Should format date", () => {
    expect(component.formatDate("2022-10-20T18:34:39Z")).toEqual("20 octobre");
  });

  it("Should round distance", () => {
    expect(component.roundDistance(10529.8)).toEqual(10.5298);
  });

  it("Should display activity title", () => {
    const activity = activitiesData[0];
    component.activities = activitiesData;
    const actual = component.getTitleToDisplay(activity);
    expect(actual).toEqual("20 octobre  Evening Run  10.7047 kms");
  });
});

import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { BaseChartDirective } from "ng2-charts";
import { vi } from "vitest";
import { Activity } from "../strava";
import { StravaWidgetView } from "./strava-widget-view";

function createActivity(activity: Partial<Activity>): Activity {
  return {
    id: 1,
    name: "Evening Run",
    type: "Run",
    distance: 10704.7,
    movingTime: 2958,
    totalElevationGain: 49.2,
    averageSpeed: 3.619,
    maxSpeed: 16.919,
    startDate: "2022-10-20T16:34:39Z",
    startDateLocal: "2022-10-20T18:34:39Z",
    ...activity
  } as Activity;
}

/** Full page of activities, of 10 km and 20 m of elevation each. */
const activities = Array.from({ length: 25 }, (_, index) =>
  createActivity({
    id: index + 1,
    name: `Run ${index + 1}`,
    distance: 10000,
    movingTime: 3000,
    totalElevationGain: 20
  })
);

describe("StravaWidgetView", () => {
  let fixture: ComponentFixture<StravaWidgetView>;
  let element: HTMLElement;

  async function createView(
    viewActivities: Activity[],
    { isUserLoggedIn = true, pageNumber = 1 } = {}
  ): Promise<void> {
    fixture = TestBed.createComponent(StravaWidgetView);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput("isUserLoggedIn", isUserLoggedIn);
    fixture.componentRef.setInput("activities", viewActivities);
    fixture.componentRef.setInput("pageNumber", pageNumber);
    fixture.componentRef.setInput("paginationActivities", 25);
    await fixture.whenStable();
  }

  function findButton(text: string): HTMLButtonElement {
    return Array.from(element.querySelectorAll("button")).find((button) =>
      button.textContent?.includes(text)
    )!;
  }

  function getOlderButton(): HTMLButtonElement {
    return element.querySelector<HTMLButtonElement>(".older-activities-button")!;
  }

  function getPageNumber(): string | undefined {
    return element.querySelector(".strava-page-number")?.textContent?.trim();
  }

  function getChartData(): BaseChartDirective["data"] {
    return fixture.debugElement
      .query(By.directive(BaseChartDirective))
      .injector.get(BaseChartDirective).data;
  }

  it("should display the login to Strava when the user is not logged in", async () => {
    await createView([], { isUserLoggedIn: false });
    const loginRequestedSpy = vi.fn();
    fixture.componentInstance.loginRequested.subscribe(loginRequestedSpy);

    expect(element.querySelector(".strava-login")?.textContent).toContain(
      "Connectez votre compte Strava pour suivre vos activités."
    );
    const loginButton = element.querySelector<HTMLButtonElement>("#login-to-strava-button")!;
    expect(loginButton.textContent).toContain("Se connecter à Strava");
    expect(element.querySelector(".strava-summary")).toBeNull();

    loginButton.click();
    expect(loginRequestedSpy).toHaveBeenCalledTimes(1);
  });

  it("should display a message without activities", async () => {
    await createView([]);

    expect(element.querySelector(".strava-empty")?.textContent).toContain(
      "Aucune activité pour le moment."
    );
    expect(element.querySelector("#activities-pagination-container")).toBeNull();
    expect(element.querySelector(".strava-login")).toBeNull();
  });

  it("should display the summary, the chart and the activities", async () => {
    await createView(activities);

    const summaryItems = element.querySelectorAll(".strava-summary-item");
    expect(summaryItems).toHaveLength(3);
    expect(summaryItems[0].textContent).toContain("25");
    expect(summaryItems[0].textContent).toContain("Activités");
    expect(summaryItems[1].textContent).toContain("250 km");
    expect(summaryItems[1].textContent).toContain("Distance");
    expect(summaryItems[2].textContent).toContain("500 m");
    expect(summaryItems[2].textContent).toContain("Dénivelé");
    expect(element.querySelector("#strava-statistics canvas")).not.toBeNull();
    expect(element.querySelectorAll("#strava-activities-container .strava-activity")).toHaveLength(
      25
    );
  });

  it("should sum the distance and the elevation of the activities", async () => {
    await createView(Array.from({ length: 25 }, (_, id) => createActivity({ id })));

    const summaryItems = element.querySelectorAll(".strava-summary-item");
    // 25 activities of 10.7047 km and 49.2 m
    expect(summaryItems[0].textContent).toContain("25");
    expect(summaryItems[1].textContent).toContain("268 km");
    expect(summaryItems[2].textContent).toContain("1,230 m");

    const chartData = getChartData();
    expect(chartData?.labels).toEqual(["oct. 2022"]);
    const [distanceDataset, activitiesDataset] = chartData?.datasets ?? [];
    expect(distanceDataset.label).toEqual("Distance (km)");
    expect(distanceDataset.data).toEqual([268]);
    expect(activitiesDataset.label).toEqual("Activités");
    expect(activitiesDataset.data).toEqual([25]);
  });

  it("should display the statistics by month, the oldest month first", async () => {
    await createView([
      createActivity({
        id: 3,
        distance: 12397.6,
        startDate: "2022-10-20T16:34:39Z",
        startDateLocal: "2022-10-20T18:34:39Z"
      }),
      createActivity({
        id: 1,
        distance: 10704.7,
        startDate: "2022-10-09T09:44:01Z",
        startDateLocal: "2022-10-09T11:44:01Z"
      }),
      createActivity({
        id: 2,
        distance: 5000.4,
        startDate: "2022-09-22T15:31:15Z",
        startDateLocal: "2022-09-22T17:31:15Z"
      })
    ]);

    // Distances rounded to the kilometer
    const chartData = getChartData();
    expect(chartData?.labels).toEqual(["sept. 2022", "oct. 2022"]);
    const [distanceDataset, activitiesDataset] = chartData?.datasets ?? [];
    expect(distanceDataset.data).toEqual([5, 23]);
    expect(activitiesDataset.data).toEqual([1, 2]);
  });

  it("should group the activities by the month of their local start date", async () => {
    // Started at 23:30 where it took place: Strava suffixes its local start date with "Z"
    await createView([
      createActivity({
        id: 1,
        startDate: "2022-09-30T21:30:00Z",
        startDateLocal: "2022-09-30T23:30:00Z"
      })
    ]);

    expect(getChartData()?.labels).toEqual(["sept. 2022"]);
    expect(element.querySelector(".activity-meta")?.textContent).toContain("30 septembre");
  });

  it("should display the first page, and request the older activities of a full page", async () => {
    await createView(activities);
    const olderActivitiesRequestedSpy = vi.fn();
    fixture.componentInstance.olderActivitiesRequested.subscribe(olderActivitiesRequestedSpy);

    expect(getPageNumber()).toEqual("Page 1");
    expect(findButton("Plus récentes").disabled).toBe(true);
    expect(getOlderButton().disabled).toBe(false);
    expect(getOlderButton().textContent).toContain("Plus anciennes");

    getOlderButton().click();
    expect(olderActivitiesRequestedSpy).toHaveBeenCalledTimes(1);
  });

  it("should request the more recent activities after the first page, not the older ones after the last page", async () => {
    await createView(activities.slice(0, 3), { pageNumber: 2 });
    const moreRecentActivitiesRequestedSpy = vi.fn();
    fixture.componentInstance.moreRecentActivitiesRequested.subscribe(
      moreRecentActivitiesRequestedSpy
    );

    expect(getPageNumber()).toEqual("Page 2");
    // Last page, as it is not full
    expect(getOlderButton().disabled).toBe(true);
    const moreRecentButton = findButton("Plus récentes");
    expect(moreRecentButton.disabled).toBe(false);

    moreRecentButton.click();
    expect(moreRecentActivitiesRequestedSpy).toHaveBeenCalledTimes(1);
  });
});

import { vi } from "vitest";
import {
  dateFromTimestamp,
  dateInTimezone,
  getOffsetFromLocalTimezone,
  toUtcWallClock
} from "./date.utils";

describe("Date utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Simulates a browser whose UTC offset is `utcOffsetInSeconds` (e.g. 3600 for UTC+1). */
  function mockBrowserUtcOffset(utcOffsetInSeconds: number): void {
    vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(-utcOffsetInSeconds / 60);
  }

  it("Should create a date from a timestamp in seconds", () => {
    expect(dateFromTimestamp(1662681600)).toEqual(new Date(Date.UTC(2022, 8, 9)));
    expect(dateFromTimestamp(1662681600, 3600)).toEqual(new Date(Date.UTC(2022, 8, 9, 1)));
  });

  it("Should keep the wall-clock time when converting to UTC", () => {
    const date = new Date(2022, 8, 9, 0, 0);
    const utcDate = toUtcWallClock(date);
    expect(utcDate.getUTCHours()).toEqual(0);
    expect(utcDate.getUTCDate()).toEqual(9);
    expect(date).toEqual(new Date(2022, 8, 9, 0, 0));
  });

  it("Should not shift a date of the local timezone", () => {
    // Local offset at the date, not now: they differ when only one of them is in summer time
    const localOffset = -dateFromTimestamp(1662681600).getTimezoneOffset() * 60;
    expect(dateInTimezone(1662681600, localOffset)).toEqual(dateFromTimestamp(1662681600));
  });

  describe("getOffsetFromLocalTimezone", () => {
    it("Should not shift when the place and the browser have the same offset", () => {
      mockBrowserUtcOffset(3600);
      expect(getOffsetFromLocalTimezone(3600)).toEqual(0);
    });

    it("Should shift from a UTC browser", () => {
      mockBrowserUtcOffset(0);
      expect(getOffsetFromLocalTimezone(7200)).toEqual(7200);
      expect(getOffsetFromLocalTimezone(-18000)).toEqual(-18000);
    });

    it("Should shift when the place and the browser have offsets of opposite signs", () => {
      mockBrowserUtcOffset(3600);
      expect(getOffsetFromLocalTimezone(-18000)).toEqual(-21600);
      expect(getOffsetFromLocalTimezone(0)).toEqual(-3600);
    });

    it("Should shift when the place and the browser have different offsets of the same sign", () => {
      mockBrowserUtcOffset(3600);
      expect(getOffsetFromLocalTimezone(7200)).toEqual(3600);
      mockBrowserUtcOffset(-18000);
      expect(getOffsetFromLocalTimezone(-28800)).toEqual(-10800);
    });

    it("Should shift when the place and the browser have opposite offsets of the same magnitude", () => {
      mockBrowserUtcOffset(3600);
      expect(getOffsetFromLocalTimezone(-3600)).toEqual(-7200);
      mockBrowserUtcOffset(-3600);
      expect(getOffsetFromLocalTimezone(3600)).toEqual(7200);
    });
  });

  it("Should display a date with the wall-clock time of the place", () => {
    // Browser in UTC+1, place in UTC+2 (e.g. Athens): 12:00 UTC is 14:00 there
    mockBrowserUtcOffset(3600);
    const noonUtc = Date.UTC(2022, 8, 9, 12) / 1000;
    const date = dateInTimezone(noonUtc, 7200);
    // Read with the mocked browser offset: local time = UTC time + 1 hour
    expect(date.getTime() + 3600 * 1000).toEqual(Date.UTC(2022, 8, 9, 14));
  });

  describe("Daylight saving time of the browser", () => {
    // Node applies a change of the TZ environment variable at runtime (no Node types in this project)
    const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } })
      .process.env;
    const initialTimezone = env["TZ"];

    beforeEach(() => {
      env["TZ"] = "Europe/Paris";
    });

    afterEach(() => {
      vi.useRealTimers();
      if (initialTimezone === undefined) {
        delete env["TZ"];
      } else {
        env["TZ"] = initialTimezone;
      }
    });

    // Sunrise in Paris (UTC+1 in winter) on 06/03/2022 at 07:23:08, i.e. 06:23:08 UTC
    const winterSunrise = 1646547788;

    it("Should display a winter date with the wall-clock time of the place, in winter", () => {
      vi.useFakeTimers({ toFake: ["Date"], now: new Date(Date.UTC(2022, 0, 15)) });
      expect(dateInTimezone(winterSunrise, 3600).toLocaleTimeString("fr")).toEqual("07:23:08");
    });

    it("Should display a winter date with the wall-clock time of the place, in summer", () => {
      vi.useFakeTimers({ toFake: ["Date"], now: new Date(Date.UTC(2022, 6, 15)) });
      expect(dateInTimezone(winterSunrise, 3600).toLocaleTimeString("fr")).toEqual("07:23:08");
    });
  });
});

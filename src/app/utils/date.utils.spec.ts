import { dateFromTimestamp, dateInTimezone, toUtcWallClock } from "./date.utils";

describe("Date utils", () => {
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
    const localOffset = -new Date().getTimezoneOffset() * 60;
    expect(dateInTimezone(1662681600, localOffset)).toEqual(dateFromTimestamp(1662681600));
  });
});

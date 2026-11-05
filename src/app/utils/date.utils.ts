const MILLISECONDS_IN_A_SECOND = 1000;
const MILLISECONDS_IN_A_MINUTE = 60 * MILLISECONDS_IN_A_SECOND;

/** Date of a timestamp in seconds, shifted by an offset in seconds. */
export function dateFromTimestamp(timestamp: number, offsetInSeconds = 0): Date {
  return new Date((timestamp + offsetInSeconds) * MILLISECONDS_IN_A_SECOND);
}

/**
 * Same wall-clock time, read as UTC.
 * Ex: Fri Sep 09 2022 00:00:00 GMT+0200 gives Fri Sep 09 2022 02:00:00 GMT+0200
 */
export function toUtcWallClock(date: Date): Date {
  return new Date(date.getTime() - date.getTimezoneOffset() * MILLISECONDS_IN_A_MINUTE);
}

/**
 * Offset, in seconds, to add to a timestamp of a place whose UTC offset is `utcOffsetInSeconds`
 * so that it is displayed in the local time of that place.
 * The local offset is the one of the browser at `date` (it changes with daylight saving time).
 */
export function getOffsetFromLocalTimezone(utcOffsetInSeconds: number, date = new Date()): number {
  const localOffset = -(date.getTimezoneOffset() * 60);
  return utcOffsetInSeconds - localOffset;
}

/** Date of a timestamp in seconds, displayed in the local time of a place with this UTC offset. */
export function dateInTimezone(timestamp: number, utcOffsetInSeconds: number): Date {
  return dateFromTimestamp(
    timestamp,
    getOffsetFromLocalTimezone(utcOffsetInSeconds, dateFromTimestamp(timestamp))
  );
}

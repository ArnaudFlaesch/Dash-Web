import { Injectable } from "@angular/core";

@Injectable()
export class DateUtilsService {
  public formatDateFromTimestamp(timestamp: number, offset = 0): Date {
    return new Date(timestamp * 1000 + offset * 1000);
  }

  /**
   * Ex: Fri Sep 09 2022 00:00:00 GMT+0200 (heure d’été d’Europe centrale)
   * Returns : Fri Sep 09 2022 02:00:00 GMT+0200 (heure d’été d’Europe centrale)
   * @param date
   * @returns
   */
  public formatDateWithOffsetToUtc(date: Date): Date {
    date.setHours(date.getHours() - date.getTimezoneOffset() / 60);
    return date;
  }

  public adjustTimeWithOffset(offset: number): number {
    const localeOffset = -(new Date().getTimezoneOffset() * 60);
    if (Math.abs(offset) === Math.abs(localeOffset)) {
      return 0;
    }
    const offsetMilliseconds = Math.abs(offset) + Math.abs(localeOffset);
    return offset < localeOffset ? -offsetMilliseconds : offsetMilliseconds;
  }
}

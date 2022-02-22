export function formatDateFromTimestamp(timestamp: number, offset = 0): Date {
  return new Date(timestamp * 1000 + offset * 1000);
}

export function formatDateFromUTC(date: string): string {
  const parsedDate = new Date(date);
  return parsedDate.toLocaleString('fr');
}

export function adjustTimeWithOffset(offset: number): number {
  const localeOffset = -(new Date().getTimezoneOffset() * 60);
  if (Math.abs(offset) === Math.abs(localeOffset)) {
    return 0;
  }
  const offsetMilliseconds = Math.abs(offset) + Math.abs(localeOffset);
  return offset < localeOffset ? -offsetMilliseconds : offsetMilliseconds;
}

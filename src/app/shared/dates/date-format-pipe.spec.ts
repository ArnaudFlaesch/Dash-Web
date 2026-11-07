import { DateFormatPipe } from "./date-format-pipe";
import { describe, expect, it, vi } from "vitest";

describe("DateFormatPipe", () => {
  const component = new DateFormatPipe();
  vi.setSystemTime(new Date(2022, 2, 15, 0, 0, 0)); // 15/03/2022

  it("should format date", () => {
    expect(component.transform(new Date())).toEqual("15/03/2022 00:00:00");
    expect(component.transform(new Date(), "short")).toEqual("15/03/2022");
    expect(component.transform(new Date().toString())).toEqual("15/03/2022 00:00:00");
    expect(component.transform(new Date().toString(), "short")).toEqual("15/03/2022");
  });

  it("should parse date-only strings as local dates", () => {
    expect(component.transform("2026-10-20", "short")).toEqual("20/10/2026");
    expect(component.transform("2026-10-20")).toEqual("20/10/2026 00:00:00");
  });
});

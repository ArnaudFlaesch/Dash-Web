import { Injector, runInInjectionContext } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { createWidgetInjector, injectWidgetData, WIDGET_DATA, WIDGET_ID } from "./widget.tokens";

describe("Widget tokens", () => {
  function injectInWidget<T>(
    widget: { id: number; data?: Record<string, unknown> },
    key: string,
    fallback: T
  ): T {
    const injector = createWidgetInjector(TestBed.inject(Injector), widget);
    return runInInjectionContext(injector, () => injectWidgetData(key, fallback));
  }

  it("Should provide the id and the data of the widget", () => {
    const injector = createWidgetInjector(TestBed.inject(Injector), {
      id: 12,
      data: { city: "Paris" }
    });
    expect(injector.get(WIDGET_ID)).toEqual(12);
    expect(injector.get(WIDGET_DATA)).toEqual({ city: "Paris" });
  });

  it("Should provide empty data to a widget without configuration", () => {
    const injector = createWidgetInjector(TestBed.inject(Injector), { id: 12 });
    expect(injector.get(WIDGET_DATA)).toEqual({});
  });

  it("Should give the saved value of a configuration key", () => {
    expect(injectInWidget({ id: 1, data: { city: "Paris" } }, "city", "")).toEqual("Paris");
    expect(injectInWidget({ id: 1, data: { urls: ["a"] } }, "urls", [])).toEqual(["a"]);
  });

  it("Should give the fallback of a missing or null configuration key", () => {
    expect(injectInWidget({ id: 1, data: { city: "Paris" } }, "url", "fallback")).toEqual(
      "fallback"
    );
    expect(injectInWidget({ id: 1, data: { city: null } }, "city", "fallback")).toEqual("fallback");
    expect(injectInWidget({ id: 1 }, "city", "fallback")).toEqual("fallback");
  });

  it("Should give the fallback without widget data provider", () => {
    expect(TestBed.runInInjectionContext(() => injectWidgetData("city", "fallback"))).toEqual(
      "fallback"
    );
  });

  it("Should keep falsy saved values", () => {
    expect(injectInWidget({ id: 1, data: { count: 0, enabled: false } }, "count", 5)).toEqual(0);
    expect(injectInWidget({ id: 1, data: { enabled: false } }, "enabled", true)).toBe(false);
  });
});

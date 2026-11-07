import { ResourceStatus } from "@angular/core";
import { isResourceLoaded } from "./resource-status";

describe("Resource utils", () => {
  it("Should be loaded once the value is resolved or updated locally", () => {
    expect(isResourceLoaded("resolved")).toBe(true);
    expect(isResourceLoaded("local")).toBe(true);
  });

  it("Should not be loaded while idle, loading, reloading or in error", () => {
    const notLoadedStatuses: ResourceStatus[] = ["idle", "loading", "reloading", "error"];
    notLoadedStatuses.forEach((status) => expect(isResourceLoaded(status)).toBe(false));
  });
});

import { ResourceStatus } from "@angular/core";

/** True once the resource has loaded its value, or once its value has been updated locally. */
export function isResourceLoaded(status: ResourceStatus): boolean {
  return status === "resolved" || status === "local";
}

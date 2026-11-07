import { Pipe, PipeTransform } from "@angular/core";
import { parseISO } from "date-fns";

/** Matches ISO date-only strings ("2026-10-20"), which `new Date()` would parse as UTC midnight. */
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Pipe({
  name: "dateFormat"
})
export class DateFormatPipe implements PipeTransform {
  public transform(value: string | Date, format: "full" | "short" = "full"): string {
    const date =
      typeof value === "string" && DATE_ONLY_PATTERN.test(value)
        ? parseISO(value)
        : new Date(value);
    return format === "short" ? date.toLocaleDateString("fr") : date.toLocaleString("fr");
  }
}

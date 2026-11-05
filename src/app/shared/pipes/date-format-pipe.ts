import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "dateFormat"
})
export class DateFormatPipe implements PipeTransform {
  public transform(value: string | Date, format: "full" | "short" = "full"): string {
    const date = new Date(value);
    return format === "short" ? date.toLocaleDateString("fr") : date.toLocaleString("fr");
  }
}

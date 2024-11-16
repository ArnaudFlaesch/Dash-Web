import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "initialUppercase",
  standalone: true
})
export class InitialUppercasePipe implements PipeTransform {
  public transform(value: string): string {
    return value ? `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}` : "";
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'dateFormat'
})
export class DateFormatPipe implements PipeTransform {
  constructor(protected sanitizer: DomSanitizer) {}

  public transform(value: string | Date): string {
    if (typeof value === 'string') {
      value = new Date(value);
    }
    return value.toLocaleString('fr');
  }
}

import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safe'
})
export class SafePipe implements PipeTransform {
  constructor(protected sanitizer: DomSanitizer) {}

  public transform(value: string, type: string): string | null {
    switch (type) {
      case 'html':
        return this.sanitizer.sanitize(SecurityContext.HTML, value);
      case 'style':
        return this.sanitizer.sanitize(SecurityContext.STYLE, value);
      case 'script':
        return this.sanitizer.sanitize(SecurityContext.SCRIPT, value);
      case 'url':
        return this.sanitizer.sanitize(SecurityContext.URL, value);
      case 'resourceUrl':
        return this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, value);
      default:
        throw new Error(`Invalid safe type specified: ${type}`);
    }
  }
}

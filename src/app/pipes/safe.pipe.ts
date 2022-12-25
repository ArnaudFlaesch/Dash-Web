import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safe'
})
export class SafePipe implements PipeTransform {
  constructor(protected sanitizer: DomSanitizer) {}

  public transform(value: string): SafeResourceUrl {
    const sanitizedUrl = this.sanitizer.sanitize(SecurityContext.URL, value) || '';
    return this.sanitizer.bypassSecurityTrustResourceUrl(sanitizedUrl);
  }
}

import { Pipe, PipeTransform, SecurityContext, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safe',
  standalone: true
})
export class SafePipe implements PipeTransform {
  protected sanitizer = inject(DomSanitizer);

  public transform(value: string, arg: string): SafeResourceUrl {
    if (arg === 'url') {
      return this.sanitizer.sanitize(SecurityContext.URL, value) ?? '';
    } else if (arg === 'resource_url') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(value);
    } else {
      return '';
    }
  }
}

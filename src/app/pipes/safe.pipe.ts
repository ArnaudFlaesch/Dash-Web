import { inject, Pipe, PipeTransform, SecurityContext } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

@Pipe({
  name: "safe"
})
export class SafePipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  public transform(value: string, context: "url" | "resource_url"): SafeResourceUrl {
    return context === "url"
      ? (this.sanitizer.sanitize(SecurityContext.URL, value) ?? "")
      : this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }
}

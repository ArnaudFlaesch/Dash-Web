import { SecurityContext } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { DomSanitizer } from "@angular/platform-browser";
import { SafePipe } from "./safe.pipe";

describe("SafePipe", () => {
  let pipe: SafePipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SafePipe] });
    pipe = TestBed.inject(SafePipe);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it("Should keep a safe url", () => {
    expect(pipe.transform("https://example.com/feed", "url")).toEqual("https://example.com/feed");
  });

  it("Should neutralize an unsafe url", () => {
    const unsafeUrl = ["javascript", "alert(1)"].join(":");
    expect(pipe.transform(unsafeUrl, "url")).toEqual(`unsafe:${unsafeUrl}`);
  });

  it("Should trust a resource url", () => {
    const resourceUrl = pipe.transform("https://example.com/embed", "resource_url");
    expect(sanitizer.sanitize(SecurityContext.RESOURCE_URL, resourceUrl)).toEqual(
      "https://example.com/embed"
    );
  });
});

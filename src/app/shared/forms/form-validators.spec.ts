import { Injector, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { form } from "@angular/forms/signals";
import { requiredText } from "./form-validators";

describe("Form validators", () => {
  function isTextValid(text: string): boolean {
    const model = signal({ text });
    const textForm = form(model, (path) => requiredText(path.text), {
      injector: TestBed.inject(Injector)
    });
    return textForm.text().valid();
  }

  it("Should accept a text with at least one non-whitespace character", () => {
    expect(isTextValid("Paris")).toBe(true);
    expect(isTextValid("  a  ")).toBe(true);
  });

  it("Should reject an empty or blank text", () => {
    expect(isTextValid("")).toBe(false);
    expect(isTextValid("   ")).toBe(false);
    expect(isTextValid("\n\t")).toBe(false);
  });
});

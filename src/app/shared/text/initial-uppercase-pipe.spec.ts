import { InitialUppercasePipe } from "./initial-uppercase-pipe";
import { describe, expect, it } from "vitest";

describe("InitialUppercasePipe", () => {
  const component = new InitialUppercasePipe();

  it("should uppercase first letter of sentence", () => {
    expect(component.transform("lundi 25 mars")).toEqual("Lundi 25 mars");
  });
});

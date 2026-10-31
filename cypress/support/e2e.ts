/// <reference types="cypress" />

import "./commands";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import addContext from "mochawesome/addContext";

import { Suite, Test } from "mocha";

Cypress.on("test:after:run", (test, runnable) => {
  if (test.state === "failed") {
    let item: Test | Suite = runnable;
    const nameParts = [runnable.title];

    while (item.parent) {
      nameParts.unshift(item.parent.title);
      item = item.parent;
    }

    const fullTestName = nameParts.filter(Boolean).join(" -- ");
    const imageUrl = `screenshots/${Cypress.spec.relative.replace("cypress/e2e/", "")}/${fullTestName} (failed).png`;

    addContext({ test }, imageUrl);
  }
});

/// <reference types="cypress" />

// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************
// Import commands.js using ES2015 syntax:
import "./commands";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import addContext from "mochawesome/addContext";

import { Suite, Test } from "mocha";

import "cypress-file-upload";

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

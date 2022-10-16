/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    loginAsAdmin(): Chainable<Response>;
    loginAsUser(): Chainable<Response>;
    navigateToTab(tabName: string): Chainable;
    createNewTab(tabName: string): Chainable;
    deleteTab(tabName: string): Chainable;
  }
}

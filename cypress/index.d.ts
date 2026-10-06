/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    loginAsAdmin(): Chainable<Response<unknown>>;
    loginAsUser(): Chainable<Response<unknown>>;
    navigateToTab(tabName: string): Chainable;
    createNewTab(tabName: string): Chainable;
    deleteTab(tabName: string): Chainable;
    createWidget(widgetType: string): Chainable;
    shouldDisplayErrorMessage(errorMessage: string): Chainable;
  }
}

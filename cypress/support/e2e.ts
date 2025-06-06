/// <reference types="cypress" />

import { Interception } from "cypress/types/net-stubbing";

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

import "cypress-file-upload";

Cypress.Commands.add("loginAsAdmin", (): Cypress.Chainable<Response> => {
  return loginAs("admintest", "adminpassword");
});

Cypress.Commands.add("loginAsUser", (): Cypress.Chainable<Response> => {
  return loginAs("usertest", "userpassword");
});

Cypress.Commands.add("navigateToTab", (tabName: string): Cypress.Chainable => {
  return navigateToTab(tabName);
});

Cypress.Commands.add("createNewTab", (tabName: string): Cypress.Chainable => {
  return createNewTab(tabName);
});

Cypress.Commands.add("deleteTab", (tabName: string): void => {
  deleteTab(tabName);
});

Cypress.Commands.add("createWidget", (widgetType: string): void => {
  createWidget(widgetType);
});

Cypress.Commands.add("shouldDisplayErrorMessage", (errorMessage: string): void => {
  shouldDisplayErrorMessage(errorMessage);
});

function loginAs(username: string, password: string): Cypress.Chainable<Response> {
  return cy.session([username, password], () => {
    cy.request({
      method: "POST",
      url: `${Cypress.env("backend_url")}/auth/login`,
      body: { username, password }
    })
      .its("body")
      .then((response) => {
        window.localStorage.setItem("user", JSON.stringify(response));
      });
  });
}

function navigateToTab(tabName: string): Cypress.Chainable {
  return cy
    .intercept("GET", "/tab/")
    .as("getTabs")
    .intercept("GET", "/widget/?tabId=*")
    .as("getWidgets")
    .loginAsAdmin()
    .visit("/")
    .wait("@getTabs")
    .then((getTabResponse: Interception) => {
      expect(getTabResponse.response.statusCode).to.equal(200);
      cy.get(".tab").contains(tabName).click();
      cy.wait("@getWidgets").then((getWidgetsResponse: Interception) => {
        expect(getWidgetsResponse.response.statusCode).to.equal(200);
      });
    });
}

function createNewTab(tabName: string): Cypress.Chainable {
  return cy
    .intercept("GET", "/tab/")
    .as("getTabs")
    .intercept("POST", "/tab/addTab")
    .as("createTab")
    .intercept("POST", "/tab/updateTab")
    .as("updateTab")
    .visit("/")
    .wait("@getTabs")
    .then((getTabsResponse) => {
      expect(getTabsResponse.response.statusCode).to.equal(200);
      cy.get("#addNewTabButton").click();
      cy.wait("@createTab").then((createTabResponse) => {
        expect(createTabResponse.response.statusCode).to.equal(200);
        cy.get(".tab:nth(-1) .tab-label").click();
        cy.get(".tab:nth(-1) .tab-label").dblclick();
        cy.get("input").clear();
        cy.get("input").type(tabName);
        cy.get("input").dblclick();
        cy.wait("@updateTab").then((updateTabResponse: Interception) => {
          expect(updateTabResponse.response.statusCode).to.equal(200);
          cy.get(".tab.selected-item .tab-label")
            .invoke("text")
            .then((text) => {
              expect(text.trim()).equal(tabName);
            });
        });
      });
    });
}

function deleteTab(tabName: string): void {
  cy.intercept("DELETE", "/tab/deleteTab*").as("deleteTab");
  cy.get(".tab").contains(tabName).dblclick();
  cy.get(".deleteTabButton").click();
  cy.wait("@deleteTab").then((deleteTabResponse: Interception) => {
    expect(deleteTabResponse.response.statusCode).to.equal(200);
  });
}

function createWidget(widgetType: string): void {
  cy.intercept("POST", "/widget/addWidget").as("addWidget");
  cy.get("#openAddWidgetModal").click();
  cy.get(`#${widgetType}`).click();
  cy.wait("@addWidget").then((request: Interception) => {
    expect(request.response.statusCode).to.equal(200);
    cy.get(".widget").should("have.length", 1);
  });
}

function shouldDisplayErrorMessage(errorMessage: string): Cypress.Chainable {
  return cy
    .get(".mat-mdc-simple-snack-bar")
    .invoke("text")
    .then((text) => {
      expect(text.trim()).equal(errorMessage);
    });
}

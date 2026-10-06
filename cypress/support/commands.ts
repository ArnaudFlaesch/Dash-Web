import { Interception } from "cypress/types/net-stubbing";
import Chainable = Cypress.Chainable;

Cypress.Commands.add("loginAsAdmin", (): Chainable<Cypress.Response<unknown>> => {
  return loginAs("admintest", "adminpassword");
});

Cypress.Commands.add("loginAsUser", (): Chainable<Cypress.Response<unknown>> => {
  return loginAs("usertest", "userpassword");
});

Cypress.Commands.add("navigateToTab", (tabName: string): Cypress.Chainable => {
  return navigateToTab(tabName);
});

Cypress.Commands.add("createNewTab", (tabName: string): Cypress.Chainable => {
  return createNewTab(tabName);
});

Cypress.Commands.add("deleteTab", (tabName: string): Cypress.Chainable => {
  return deleteTab(tabName);
});

Cypress.Commands.add("createWidget", (widgetType: string): Cypress.Chainable => {
  return createWidget(widgetType);
});

Cypress.Commands.add("shouldDisplayErrorMessage", (errorMessage: string): Cypress.Chainable => {
  return shouldDisplayErrorMessage(errorMessage);
});

function loginAs(username: string, password: string): Chainable<Cypress.Response<unknown>> {
  return cy.env(["BACKEND_URL"]).then(({ BACKEND_URL }) => {
    return cy
      .request<unknown>({
        method: "POST",
        url: `${BACKEND_URL}/auth/login`,
        body: { username, password }
      })
      .then(({ body }) => {
        window.localStorage.setItem("user", JSON.stringify(body));
      });
  });
}

function navigateToTab(tabName: string): Cypress.Chainable {
  cy.intercept("GET", "/tab/").as("getTabs");
  cy.intercept("GET", "/widget/?tabId=*").as("getWidgets");
  cy.visit("/");
  return cy.wait("@getTabs").then((getTabResponse: Interception) => {
    expect(getTabResponse?.response?.statusCode).to.equal(200);
    cy.get(".tab").contains(tabName).click();
    cy.wait("@getWidgets").then((getWidgetsResponse: Interception) => {
      expect(getWidgetsResponse?.response?.statusCode).to.equal(200);
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
      expect(getTabsResponse?.response?.statusCode).to.equal(200);
      cy.get("#addNewTabButton").click();
      cy.wait("@createTab").then((createTabResponse) => {
        expect(createTabResponse?.response?.statusCode).to.equal(200);
        cy.get(".tab:nth(-1) .tab-label").click();
        cy.get(".tab:nth(-1) .tab-label").dblclick();
        cy.get("input").clear();
        cy.get("input").type(tabName);
        cy.get("input").dblclick();
        cy.wait("@updateTab").then((updateTabResponse: Interception) => {
          expect(updateTabResponse?.response?.statusCode).to.equal(200);
          cy.get(".tab.selected-item .tab-label")
            .invoke("text")
            .then((text) => {
              expect(text.trim()).equal(tabName);
            });
        });
      });
    });
}

function deleteTab(tabName: string): Cypress.Chainable {
  cy.intercept("DELETE", "/tab/deleteTab*").as("deleteTab");
  cy.get(".tab").contains(tabName).dblclick();
  cy.get(".deleteTabButton").click();
  return cy.wait("@deleteTab").then((deleteTabResponse: Interception) => {
    expect(deleteTabResponse?.response?.statusCode).to.equal(200);
  });
}

function createWidget(widgetType: string): Cypress.Chainable {
  cy.intercept("POST", "/widget/addWidget").as("addWidget");
  cy.get("#openAddWidgetModal").click();
  cy.get(`#${widgetType}`).click();
  return cy.wait("@addWidget").then((request: Interception) => {
    expect(request?.response?.statusCode).to.equal(200);
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

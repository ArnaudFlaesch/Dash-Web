/// <reference types="cypress" />

import { Interception } from "cypress/types/net-stubbing";

describe("Tab tests", () => {
  beforeEach(() => {
    cy.loginAsAdmin().visit("/");
    cy.get(".tab.selected-item").should("be.visible");
  });

  it("Should create a new tab", () => {
    cy.get("#addNewTabButton").click();
    cy.get(".tab").should("have.length", 2);
  });

  it("Should edit the created tab", () => {
    cy.intercept("POST", "/tab/updateTab").as("updateTab");
    cy.get(".tab:nth(-1) .tab-label").click();
    cy.get(".tab:nth(-1) .tab-label").dblclick();
    cy.get("input").clear();
    cy.get("input").type("News feed");
    cy.get("input").dblclick();
    cy.wait("@updateTab").then(() => {
      cy.get(".tab.selected-item .tab-label")
        .invoke("text")
        .then((text) => {
          expect(text.trim()).equal("News feed");
        });
      cy.get(".tab").contains("News feed").click();
      cy.get(".tab").contains("News feed").dblclick();
      cy.get("input").clear();
      cy.get("input").type("News feed Updated{Enter}");
      cy.wait("@updateTab").then(() => {
        cy.get(".tab.selected-item .tab-label")
          .invoke("text")
          .then((text) => {
            expect(text.trim()).equal("News feed Updated");
          });
      });
    });
  });

  it("Should delete the created tab", () => {
    cy.intercept("DELETE", "/tab/deleteTab*")
      .as("deleteTab")
      .get(".tab")
      .contains("News feed Updated")
      .dblclick();
    cy.get(".deleteTabButton").click();
    cy.wait("@deleteTab").then((response: Interception) => {
      expect(response.response.statusCode).to.equal(200);
      cy.get(".tab").should("have.length", 1);
    });
  });
});

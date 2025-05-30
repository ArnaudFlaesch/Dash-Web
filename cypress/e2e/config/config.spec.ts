/// <reference types="cypress" />

import { Interception } from "cypress/types/net-stubbing";

describe("Config tests", () => {
  beforeEach(() => {
    cy.loginAsAdmin().visit("/");
    cy.get(".tab.selected-item").should("be.visible");
  });

  it("Should export config", () => {
    cy.intercept("GET", "/dashConfig/export").as("downloadConfig");
    cy.get("#dash-menu").click();
    cy.get("#downloadConfigButton").click();
    cy.wait("@downloadConfig").then((request: Interception) => {
      expect(request.response.statusCode).to.equal(200);
    });
  });

  it("Should import config", () => {
    cy.intercept("POST", "/dashConfig/import").as("importConfig");
    cy.get("#dash-menu").click();
    cy.get("#openImportConfigModal").click();
    cy.get("#file").attachFile("dashboardConfigTest.json");
    cy.get("#uploadFileButton").click();
    cy.wait("@importConfig").then((request: Interception) => {
      expect(request.response.statusCode).to.equal(200);
      cy.reload()
        .intercept("DELETE", "/tab/deleteTab*")
        .as("deleteTab")
        .get(".tab")
        .should("have.length", 2)
        .contains("Perso")
        .click();
      cy.get(".widget").should("have.length", 5).get(".tab").contains("Perso").dblclick();
      cy.get(".deleteTabButton").click();
      cy.wait("@deleteTab").then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get(".tab").should("have.length", 1);
      });
    });
  });
});

/// <reference types="cypress" />

import { Interception } from "cypress/types/net-stubbing";

describe("Login tests", () => {
  beforeEach(() => cy.intercept("POST", "/auth/login").as("login").visit("/"));

  it("Should fail to login", () => {
    // Focusing first floats the mat-label, which otherwise covers the empty input
    cy.get("#login-button").should("be.disabled").get("#input-username").focus();
    cy.get("#input-username").type("test");
    cy.get("#input-password").focus();
    cy.get("#input-password").type("test");
    cy.get("#login-button").should("be.enabled").click();
    cy.wait("@login").then((request: Interception) => {
      expect(request.response?.statusCode).to.equal(401);
      cy.shouldDisplayErrorMessage("Erreur lors de la connexion de l'utilisateur.");
    });
  });

  it("Should login and logout", () => {
    cy.get("#input-username").focus();
    cy.get("#input-username").clear();
    cy.get("#input-username").type("admintest");
    cy.get("#input-password").focus();
    cy.get("#input-password").clear();
    cy.get("#input-password").type("adminpassword");
    cy.get("#login-button").should("be.enabled").click();
    cy.wait("@login").then((request: Interception) => {
      expect(request.response?.statusCode).to.equal(200);
      cy.url().should("be.equal", `${Cypress.config("baseUrl")}home`);
      cy.get("#dash-menu").click();
      cy.get("#logout-button").click();
      cy.get("#login-page-title").should("have.text", "Dash");
      cy.url()
        .should("be.equal", `${Cypress.config("baseUrl")}login`)
        .then(() => expect(localStorage.getItem("user")).to.be.null);
    });
  });
});

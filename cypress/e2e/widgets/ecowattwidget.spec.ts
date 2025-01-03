/// <reference types="cypress" />

describe("Ecowatt Widget tests", () => {
  const tabName = "Ecowatt";

  beforeEach(() => cy.loginAsAdmin().navigateToTab(tabName));

  before(() => cy.loginAsAdmin().createNewTab(tabName).createWidget("ECOWATT"));

  after(() => cy.loginAsAdmin().navigateToTab(tabName).deleteTab(tabName));

  it("Should verify that the widget was added to the dashboard", () => {
    cy.get(".ecowatt-widget-header").should("have.text", "Ecowatt");
  });
});

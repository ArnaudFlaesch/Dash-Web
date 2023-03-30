/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('RSS Widget errors tests', () => {
  const tabName = 'Flux RSS';

  before(() => cy.loginAsAdmin().createNewTab(tabName));

  after(() => cy.loginAsAdmin().navigateToTab(tabName).deleteTab(tabName));

  beforeEach(() => {
    cy.loginAsAdmin().navigateToTab(tabName);
  });

  it('Should fail to create a RSS widget', () => {
    cy.intercept('POST', '/widget/addWidget', { statusCode: 500 })
      .as('addWidgetError')
      .get('#openAddWidgetModal')
      .click();
    cy.get('#RSS').click();
    cy.wait('@addWidgetError').then((request: Interception) => {
      expect(request.response.statusCode).to.equal(500);
      cy.shouldDisplayErrorMessage("Erreur lors de l'ajout d'un widget.")
        .get('.widget')
        .should('have.length', 0);
    });
  });
});

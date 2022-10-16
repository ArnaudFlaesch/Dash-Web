/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('RSS Widget errors tests', () => {
  const tabName = 'Flux RSS';

  before(() => cy.createNewTab(tabName));

  after(() => cy.deleteTab(tabName));

  beforeEach(() => {
    cy.navigateToTab(tabName);
  });

  it('Should fail to create a RSS widget', () => {
    cy.intercept('POST', '/widget/addWidget', { statusCode: 500 })
      .as('addWidgetError')
      .get('#openAddWidgetModal')
      .click()
      .get('#RSS')
      .click()
      .wait('@addWidgetError')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(500);
        cy.get('.mat-simple-snack-bar-content')
          .should('have.text', "Erreur lors de l'ajout d'un widget.")
          .get('.widget')
          .should('have.length', 0);
      });
  });
});

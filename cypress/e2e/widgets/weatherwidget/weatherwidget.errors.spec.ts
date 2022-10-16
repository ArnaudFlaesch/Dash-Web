/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Weather Widget error tests', () => {
  const tabName = 'Météo';

  before(() => cy.createNewTab(tabName));

  after(() => cy.deleteTab(tabName));

  beforeEach(() => {
    cy.navigateToTab(tabName);
  });

  it('Should fail to create a Weather Widget', () => {
    cy.intercept('POST', '/widget/addWidget', { statusCode: 500 })
      .as('addWidgetError')
      .get('#openAddWidgetModal')
      .click()
      .get('#WEATHER')
      .click()
      .wait('@addWidgetError')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(500);
        cy.get('.widget')
          .should('have.length', 0)
          .get('.mat-simple-snack-bar-content')
          .should('have.text', "Erreur lors de l'ajout d'un widget.");
      });
  });
});

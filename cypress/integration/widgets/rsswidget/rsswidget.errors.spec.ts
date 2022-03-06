/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('RSS Widget errors tests', () => {
  function refreshAndWaitForTabToBeVisible() {
    return cy
      .loginAsAdmin()
      .visit('/')
      .title()
      .should('equals', 'Dash')
      .waitUntil(() => cy.get('.tab.selected-item').should('be.visible'));
  }

  beforeEach(() => {
    refreshAndWaitForTabToBeVisible();
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
        cy.get('.mat-simple-snack-bar-content').should(
          'have.text',
          "Erreur lors de l'ajout d'un widget."
        );
      });
  });

  it('Should fail to delete a created widget', () => {
    cy.intercept('POST', '/widget/addWidget')
      .as('addWidget')
      .get('#openAddWidgetModal')
      .click()
      .get('#RSS')
      .click()
      .wait('@addWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.widget')
          .should('have.length', 1)
          .intercept('DELETE', '/widget/deleteWidget/*', { statusCode: 500 })
          .as('deleteWidgetError')
          .get('.deleteButton')
          .click()
          .get('h4')
          .should('have.text', 'Êtes-vous sûr de vouloir supprimer ce widget ?')
          .get('.validateDeletionButton')
          .click()
          .wait('@deleteWidgetError')
          .then((request: Interception) => {
            expect(request.response.statusCode).to.equal(500);
            cy.get('.mat-simple-snack-bar-content').should(
              'have.text',
              "Erreur lors de la suppression d'un widget."
            );
          });
      });
  });

  it('Should delete the widget', () => {
    cy.intercept('DELETE', '/widget/deleteWidget/*').as('deleteWidget');
    refreshAndWaitForTabToBeVisible()
      .get('.deleteButton')
      .click()
      .get('h4')
      .should('have.text', 'Êtes-vous sûr de vouloir supprimer ce widget ?')
      .get('.validateDeletionButton')
      .click()
      .wait('@deleteWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.widget').should('have.length', 0);
      });
  });
});

/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Twitter Widget error tests', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
      .visit('/')
      .title()
      .should('equals', 'Dash')
      .waitUntil(() => cy.get('.tab.selected-item').should('be.visible'));
  });

  it('Should create a Twitter Widget and fail to update it', () => {
    cy.get('#openAddWidgetModal')
      .click()
      .intercept('POST', '/widget/addWidget')
      .as('addWidget')
      .get('#TWITTER_TIMELINE')
      .click()
      .wait('@addWidget')
      .then((createWidgetRequest: Interception) => {
        expect(createWidgetRequest.response.statusCode).to.equal(200);
        cy.get('.widget')
          .should('have.length', 1)
          .intercept('PATCH', '/widget/updateWidgetData/*', { statusCode: 500 })
          .as('updateWidgetError')
          .get('.validateProfileButton')
          .should('be.disabled')
          .get('input')
          .type('nodejs')
          .get('.validateProfileButton')
          .click()
          .wait('@updateWidgetError')
          .then((request: Interception) => {
            expect(request.response.statusCode).to.equal(500);
            cy.get('.mat-simple-snack-bar-content').should(
              'have.text',
              'Erreur lors de la modification du widget.'
            );
          });
      });
  });

  it('Should delete previously added widget', () => {
    cy.intercept('DELETE', '/widget/deleteWidget/*')
      .as('deleteWidget')
      .get('.deleteButton')
      .click()
      .get('h4')
      .should('have.text', 'Êtes-vous sûr de vouloir supprimer ce widget ?')
      .get('.validateDeletionButton')
      .click()
      .wait('@deleteWidget')
      .then(() => {
        cy.get('.widget').should('have.length', 0);
      });
  });
});

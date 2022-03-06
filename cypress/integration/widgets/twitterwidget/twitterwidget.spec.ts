/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Twitter Widget tests', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
      .visit('/')
      .title()
      .should('equals', 'Dash')
      .waitUntil(() => cy.get('.tab.selected-item').should('be.visible'));
  });

  it('Should create a Twitter Widget and add it to the dashboard', () => {
    cy.get('#openAddWidgetModal')
      .click()
      .intercept('POST', '/widget/addWidget')
      .as('addWidget')
      .get('#TWITTER_TIMELINE')
      .click()
      .wait('@addWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.widget').should('have.length', 1);
      });
  });

  it('Should display the timeline', () => {
    cy.intercept('PATCH', '/widget/updateWidgetData/*')
      .as('updateWidget')
      .get('.validateProfileButton')
      .should('be.disabled')
      .get('input')
      .type('nodejs')
      .get('.validateProfileButton')
      .click()
      .wait('@updateWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('iframe').should('be.visible');
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

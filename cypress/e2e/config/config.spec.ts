/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Config tests', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
      .visit('/')
      .waitUntil(() => cy.get('.tab.selected-item').should('be.visible'));
  });

  it('Should export config', () => {
    cy.intercept('GET', '/dashConfig/export')
      .as('downloadConfig')
      .get('#downloadConfigButton')
      .click()
      .wait('@downloadConfig')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
      });
  });

  it('Should import config', () => {
    cy.intercept('POST', '/dashConfig/import')
      .as('importConfig')
      .get('#openImportConfigModal')
      .click()
      .get('#file')
      .attachFile('dashboardConfigTest.json')
      .get('#uploadFileButton')
      .click()
      .wait('@importConfig')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.reload()
          .intercept('DELETE', '/tab/deleteTab*')
          .as('deleteTab')
          .get('.tab')
          .should('have.length', 2)
          .contains('Perso')
          .click()
          .get('.widget')
          .should('have.length', 5)
          .get('.tab')
          .contains('Perso')
          .dblclick()
          .get('.deleteTabButton')
          .click()
          .wait('@deleteTab')
          .then((request: Interception) => {
            expect(request.response.statusCode).to.equal(200);
            cy.get('.tab').should('have.length', 1);
          });
      });
  });
});

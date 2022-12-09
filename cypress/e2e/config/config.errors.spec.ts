/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Config error tests', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
      .visit('/')
      .waitUntil(() => cy.get('.tab.selected-item').should('be.visible'));
  });

  it('Should fail to export config', () => {
    cy.intercept('GET', '/dashConfig/export', { statusCode: 500 })
      .as('downloadConfigError')
      .get('#downloadConfigButton')
      .click()
      .wait('@downloadConfigError')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(500);
        cy.shouldDisplayErrorMessage(
          "Erreur lors de l'export de la configuration."
        );
      });
  });

  it('Should fail to import config', () => {
    cy.intercept('POST', '/dashConfig/import', { statusCode: 500 })
      .as('importConfigError')
      .get('#openImportConfigModal')
      .click()
      .get('#file')
      .attachFile('dashboardConfigTest.json')
      .get('#uploadFileButton')
      .click()
      .wait('@importConfigError')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(500);
        cy.shouldDisplayErrorMessage(
          "Erreur lors de l'import de la configuration."
        );
      });
  });
});

import { Interception } from 'cypress/types/net-stubbing';

describe('Tab error tests', () => {
  beforeEach(() =>
    cy
      .loginAsAdmin()
      .visit('/')
      .waitUntil(() => cy.get('.tab.selected-item').should('be.visible'))
  );

  it('Should fail to get the list of tabs', () => {
    cy.intercept('GET', '/tab/', { statusCode: 500 })
      .as('getTabsError')
      .visit('/')
      .wait('@getTabsError')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(500);
        cy.shouldDisplayErrorMessage("Erreur lors de l'initialisation du dashboard.");
      });
  });

  it('Should fail to get the widgets', () => {
    cy.intercept('GET', '/widget/*', { statusCode: 500 })
      .as('getWidgetsError')
      .visit('/')
      .wait('@getWidgetsError')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(500);
        cy.shouldDisplayErrorMessage('Erreur lors de la récupération des widgets.');
      });
  });

  it('Should fail to add a tab', () => {
    cy.intercept('POST', '/tab/addTab', { statusCode: 500 }).as('addTabError');
    cy.get('.tab').should('have.length', 1);
    cy.get('#addNewTabButton').click();
    cy.wait('@addTabError').then((request: Interception) => {
      expect(request.response.statusCode).to.equal(500);
      cy.shouldDisplayErrorMessage("Erreur lors de l'ajout d'un onglet.")
        .get('.tab')
        .should('have.length', 1);
    });
  });

  it('Should fail to edit the tab', () => {
    cy.intercept('POST', '/tab/updateTab', { statusCode: 500 })
      .as('updateTabError')
      .get('.tab-label')
      .eq(0)
      .invoke('text')
      .then((text) => {
        expect(text.trim()).equal('Home');
      });
    cy.get('.tab').eq(0).dblclick();
    cy.get('input').clear();
    cy.get('input').type('Flux RSS');
    cy.get('input').dblclick();
    cy.wait('@updateTabError').then((request: Interception) => {
      expect(request.response.statusCode).to.equal(500);
      cy.shouldDisplayErrorMessage("Erreur lors de la modification d'un onglet.")
        .reload()
        .get('.tab')
        .should('have.length', 1)
        .eq(0)
        .find('.tab-label')
        .invoke('text')
        .then((text) => {
          expect(text.trim()).equal('Home');
        });
    });
  });

  it('Should fail to delete the tab', () => {
    cy.intercept('DELETE', '/tab/deleteTab*', { statusCode: 500 }).as('deleteTabError');
    cy.get('.tab').should('have.length', 1).eq(0).dblclick();
    cy.get('.deleteTabButton').click();
    cy.wait('@deleteTabError').then((request: Interception) => {
      expect(request.response.statusCode).to.equal(500);
      cy.shouldDisplayErrorMessage("Erreur lors de la suppression d'un onglet.")
        .get('.tab')
        .should('have.length', 1);
    });
  });
});

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
        cy.shouldDisplayErrorMessage(
          "Erreur lors de l'initialisation du dashboard."
        );
      });
  });

  it('Should fail to get the widgets', () => {
    cy.intercept('GET', '/widget/*', { statusCode: 500 })
      .as('getWidgetsError')
      .visit('/')
      .wait('@getWidgetsError')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(500);
        cy.shouldDisplayErrorMessage(
          'Erreur lors de la récupération des widgets.'
        );
      });
  });

  it('Should fail to add a tab', () => {
    cy.intercept('POST', '/tab/addTab', { statusCode: 500 })
      .as('addTabError')
      .get('.tab')
      .should('have.length', 1)
      .get('#addNewTabButton')
      .click()
      .wait('@addTabError')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(500);
        cy.shouldDisplayErrorMessage("Erreur lors de l'ajout d'un onglet.")
          .get('.tab')
          .should('have.length', 1);
      });
  });

  it('Should fail to edit the tab', () => {
    cy.intercept('POST', '/tab/updateTab', { statusCode: 500 })
      .as('updateTabError')
      .get('.tabLabel')
      .eq(0)
      .invoke('text')
      .then((text) => {
        expect(text.trim()).equal('Home');
      })
      .get('.tab')
      .eq(0)
      .dblclick()
      .get('input')
      .clear()
      .type('Flux RSS')
      .dblclick()
      .wait('@updateTabError')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(500);
        cy.shouldDisplayErrorMessage(
          "Erreur lors de la modification d'un onglet."
        )
          .reload()
          .get('.tab')
          .should('have.length', 1)
          .eq(0)
          .find('.tabLabel')
          .invoke('text')
          .then((text) => {
            expect(text.trim()).equal('Home');
          });
      });
  });

  it('Should fail to delete the tab', () => {
    cy.intercept('DELETE', '/tab/deleteTab/*', { statusCode: 500 })
      .as('deleteTabError')
      .get('.tab')
      .should('have.length', 1)
      .eq(0)
      .dblclick()
      .get('.deleteTabButton')
      .click()
      .wait('@deleteTabError')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(500);
        cy.shouldDisplayErrorMessage(
          "Erreur lors de la suppression d'un onglet."
        )
          .get('.tab')
          .should('have.length', 1);
      });
  });
});

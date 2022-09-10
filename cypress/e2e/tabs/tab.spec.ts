/// <reference types="cypress" />

describe('Tab tests', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
      .visit('/')
      .waitUntil(() => cy.get('.tab.selected-item').should('be.visible'));
  });

  it('Should create a new tab', () => {
    cy.get('#addNewTabButton').click().get('.tab').should('have.length', 7);
  });

  it('Should edit the created tab', () => {
    cy.intercept('POST', '/tab/updateTab')
      .as('updateTab')
      .get('.tab:nth(-1) .tabLabel')
      .click()
      .dblclick()
      .invoke('text')
      .then((text) => {
        expect(text.trim()).equal('Nouvel onglet');
      })
      .get('input')
      .clear()
      .type('News feed')
      .dblclick()
      .wait('@updateTab')
      .then(() => {
        cy.get('.tab.selected-item .tabLabel')
          .invoke('text')
          .then((text) => {
            expect(text.trim()).equal('News feed');
          })
          .get('.tab')
          .contains('News feed')
          .click()
          .dblclick()
          .get('input')
          .clear()
          .type('News feed Updated{Enter}')
          .wait('@updateTab')
          .then(() => {
            cy.get('.tab.selected-item .tabLabel')
              .invoke('text')
              .then((text) => {
                expect(text.trim()).equal('News feed Updated');
              });
          });
      });
  });

  it('Should delete the created tab', () => {
    cy.intercept('DELETE', '/tab/deleteTab/*')
      .as('deleteTab')
      .get('.tab')
      .contains('News feed Updated')
      .dblclick()
      .get('.deleteTabButton')
      .click()
      .wait('@deleteTab')
      .then(() => {
        cy.get('.tab').should('have.length', 6);
      });
  });
});

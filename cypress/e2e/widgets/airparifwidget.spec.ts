/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('AirParif Widget tests', () => {
  const tabName = 'AirParif';

  beforeEach(() => cy.navigateToTab(tabName));

  before(() => cy.createNewTab(tabName));

  after(() => cy.deleteTab(tabName));

  it('Should create an AirParif Widget and add it to the dashboard', () => {
    cy.intercept('POST', '/widget/addWidget')
      .as('addWidget')
      .get('#openAddWidgetModal')
      .click()
      .get('#AIRPARIF')
      .click()
      .wait('@addWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.widget').should('have.length', 1);
      });
  });
});

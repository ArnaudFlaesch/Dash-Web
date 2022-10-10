/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('AirParif Widget tests', () => {
  const tabName = 'AirParif';

  beforeEach(() => cy.navigateToTab(tabName));

  before(() => cy.createNewTab(tabName));

  after(() => cy.deleteTab(tabName));

  const AIR_PARIF_VALID_TOKEN = 'AIRPARIFTOKEN';

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

  it('Should insert valid configuration', () => {
    const communeInseeCode = '75112';
    cy.get('#airParifApiKey')
      .type(AIR_PARIF_VALID_TOKEN)
      .get('#communeInseeCode')
      .type(communeInseeCode)
      .intercept(
        'GET',
        `/airParifWidget/previsionCommune?commune=${communeInseeCode}`,
        {
          fixture: 'airParif/forecast.json'
        }
      )
      .as('getForecastData')
      .intercept('GET', `/airParifWidget/couleurs*`, {
        fixture: 'airParif/colors.json'
      })
      .as('getColorsData')
      .get('.validateButton')
      .click()
      .wait(['@getForecastData', '@getColorsData'])
      .then((requests: Interception[]) => {
        expect(requests[0].response.statusCode).to.equal(200);
        expect(requests[1].response.statusCode).to.equal(200);
      });
  });
});

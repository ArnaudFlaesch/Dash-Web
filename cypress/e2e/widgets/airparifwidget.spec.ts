/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('AirParif Widget tests', () => {
  const tabName = 'AirParif';

  beforeEach(() => cy.loginAsAdmin().navigateToTab(tabName));

  before(() => cy.loginAsAdmin().createNewTab(tabName).createWidget('AIRPARIF'));

  after(() => cy.loginAsAdmin().navigateToTab(tabName).deleteTab(tabName));

  const AIR_PARIF_VALID_TOKEN = 'AIRPARIFTOKEN';

  it('Should insert valid configuration', () => {
    const communeInseeCode = '75112';
    cy.get('#airParifApiKey')
      .type(AIR_PARIF_VALID_TOKEN)
      .get('#communeInseeCodeLabel')
      .click()
      .get('#communeInseeCode')
      .type(communeInseeCode)
      .intercept('GET', `/airParifWidget/previsionCommune?commune=${communeInseeCode}`)
      .as('getForecastData')
      .intercept('GET', `/airParifWidget/couleurs*`)
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

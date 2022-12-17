/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Weather Widget tests', () => {
  const tabName = 'Weather';

  before(() => cy.loginAsAdmin().createNewTab(tabName).createWidget('WEATHER'));

  after(() => cy.loginAsAdmin().navigateToTab(tabName).deleteTab(tabName));

  beforeEach(() => {
    cy.intercept('GET', `/weatherWidget/weather?city=*`)
      .as('getWeather')
      .intercept('GET', `/weatherWidget/forecast?city=*`)
      .as('getForecast')
      .clock(new Date(2022, 9, 29, 0, 0, 0).getTime())
      .loginAsAdmin()
      .navigateToTab(tabName);
  });

  afterEach(() =>
    cy.clock().then((clock) => {
      clock.restore();
    })
  );

  it('Should refresh Weather widget', () => {
    cy.get('#cityNameInput')
      .type('Paris')
      .get('.validateButton')
      .click()
      .wait(['@getWeather', '@getForecast'])
      .then((request: Interception[]) => {
        expect(request[0].response.statusCode).to.equal(200);
        expect(request[1].response.statusCode).to.equal(200);
        cy.get('.widget .forecast').should('have.length.at.least', 2);
      });
  });

  it("Should toggle between today's, tomorrow's and the week's forecasts", () => {
    cy.get('.widget .toggleForecast:nth(0)')
      .click()
      .get('.widget .forecast-row')
      .scrollIntoView()
      .get('.widget .forecast')
      .should('have.length.at.least', 2)
      .get('.widget .toggleForecast:nth(1)')
      .click()
      .get('.forecast')
      .should('have.length.at.least', 5)
      .get('.widget #toggleWeekForecast')
      .click()
      .get('.widget .forecast')
      .should('have.length.at.least', 3);
  });
});

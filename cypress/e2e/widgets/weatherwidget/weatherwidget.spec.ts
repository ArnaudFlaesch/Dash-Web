/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Weather Widget tests', () => {
  const tabName = 'Weather';

  before(() => cy.createNewTab(tabName));

  after(() => cy.deleteTab(tabName));

  beforeEach(() => {
    cy.intercept('GET', `/weatherWidget/weather?city=*`, {
      fixture: 'weather/parisWeatherSample.json'
    })
      .as('getWeather')
      .intercept('GET', `/weatherWidget/forecast?city=*`, {
        fixture: 'weather/parisForecastSample.json'
      })
      .as('getForecast')
      .navigateToTab(tabName);
  });

  it('Should create a Weather Widget and add it to the dashboard', () => {
    cy.intercept('POST', '/widget/addWidget')
      .as('addWidget')
      .get('#openAddWidgetModal')
      .click()
      .get('#WEATHER')
      .click()
      .wait('@addWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.widget').should('have.length', 1);
      });
  });

  it('Should refresh Weather widget', () => {
    cy.clock(new Date(2022, 2, 9, 0, 0, 0).getTime())
      .get('#cityNameInput')
      .type('Paris')
      .get('.validateButton')
      .click()
      .wait(['@getWeather', '@getForecast'])
      .then((request: Interception[]) => {
        expect(request[0].response.statusCode).to.equal(200);
        expect(request[1].response.statusCode).to.equal(200);
        cy.get('.widget .forecast').should('have.length.at.least', 2);
      })
      .clock()
      .then((clock) => {
        clock.restore();
      });
  });

  it("Should toggle between today's, tomorrow's and the week's forecasts", () => {
    cy.clock(new Date(2020, 6, 15, 0, 0, 0).getTime())
      .get('.widget .toggleForecast:nth(0)')
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
      .should('have.length', 5)
      .clock()
      .then((clock) => {
        clock.restore();
      });
  });
});

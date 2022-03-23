/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Weather Widget tests', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
      .visit('/')
      .title()
      .should('equals', 'Dash')
      .waitUntil(() => cy.get('.tab.selected-item').should('be.visible'))
      .intercept('GET', `/weatherWidget/weather?city=*`, {
        fixture: 'weather/parisWeatherSample.json'
      })
      .as('getWeather')
      .intercept('GET', `/weatherWidget/forecast?city=*`, {
        fixture: 'weather/parisForecastSample.json'
      })
      .as('getForecast')
      .get('.tab')
      .contains('Météo')
      .click()
      .wait(['@getWeather', '@getForecast'])
      .then((requests: Interception[]) => {
        expect(requests[0].response.statusCode).to.equal(200);
        expect(requests[1].response.statusCode).to.equal(200);
      });
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
        cy.get('.widget').should('have.length', 2);
      });
  });

  it('Should refresh Weather widget', () => {
    cy.clock(new Date(2020, 6, 15, 0, 0, 0).getTime())
      .get('#cityNameInput')
      .type('Paris')
      .get('.validateButton')
      .click()
      .wait(['@getWeather', '@getForecast'])
      .then((request: Interception[]) => {
        expect(request[0].response.statusCode).to.equal(200);
        expect(request[1].response.statusCode).to.equal(200);
        cy.get('.widget:nth(1) .forecast').should('have.length.at.least', 5);
      })
      .clock()
      .then((clock) => {
        clock.restore();
      });
  });

  it("Should toggle between today's, tomorrow's and the week's forecasts", () => {
    cy.clock(new Date(2020, 6, 15, 0, 0, 0).getTime())
      .get('.widget:nth(1) #toggleTodayForecast')
      .click()
      .get('.widget:nth(1) .forecast-row')
      .scrollIntoView()
      .get('.widget:nth(1) .forecast')
      .should('have.length.at.least', 5)
      .get('.widget:nth(1) #toggleTomorrowForecast')
      .click()
      .get('.forecast')
      .should('have.length.at.least', 5)
      .get('.widget:nth(1) #toggleWeekForecast')
      .click()
      .get('.widget:nth(1) .forecast')
      .should('have.length', 5)
      .clock()
      .then((clock) => {
        clock.restore();
      });
  });

  it('Should delete previously added widget', () => {
    cy.intercept('DELETE', '/widget/deleteWidget/*')
      .as('deleteWidget')
      .get('.widget:nth(0) .deleteButton')
      .click()
      .get('h4')
      .should('have.text', 'Êtes-vous sûr de vouloir supprimer ce widget ?')
      .get('.validateDeletionButton')
      .click()
      .wait('@deleteWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.widget').should('have.length', 1);
      });
  });
});

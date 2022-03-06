/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Weather Widget tests', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
      .visit('/')
      .title()
      .should('equals', 'Dash')
      .waitUntil(() => cy.get('.tab.selected-item').should('be.visible'))
      .intercept('GET', `/weatherWidget/weather`, {
        fixture: 'parisWeatherSample.json'
      })
      .as('refreshWidget')
      .intercept('GET', `/weatherWidget/forecast`, {
        fixture: 'parisWeatherSample.json'
      })
      .as('getForecast');
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
      .get('#validateButton')
      .click()
      .get('.refreshButton')
      .click()
      .wait('@refreshWidget')
      .then(() => {
        cy.get('.forecast').should('have.length.at.least', 5);
      })
      .clock()
      .then((clock) => {
        clock.restore();
      });
  });

  it("Should toggle between today's, tomorrow's and the week's forecasts", () => {
    cy.clock(new Date(2020, 6, 15, 0, 0, 0).getTime())
      .get('#toggleTodayForecast')
      .click()
      .get('.forecastRow')
      .scrollIntoView()
      .get('.forecast')
      .should('have.length.at.least', 5)
      .get('#toggleTomorrowForecast')
      .click()
      .get('.forecast')
      .should('have.length.at.least', 5)
      .get('#toggleWeekForecast')
      .click()
      .get('.forecast')
      .should('have.length', 5)
      .clock()
      .then((clock) => {
        clock.restore();
      });
  });

  it('Should delete previously added widget', () => {
    cy.intercept('DELETE', '/widget/deleteWidget/*')
      .as('deleteWidget')
      .get('.deleteButton')
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

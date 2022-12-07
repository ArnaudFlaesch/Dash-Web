/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Strava Widget tests', () => {
  const STRAVA_TOKEN = 'FAKE_TOKEN';
  const STRAVA_REFRESH_TOKEN = 'FAKE_REFRESH_TOKEN';
  const TOKEN_EXPIRATION_DATE = Date.now() + 3600;

  const tabName = 'Strava';

  before(() => cy.createNewTab(tabName));

  after(() => cy.deleteTab(tabName));

  beforeEach(() => cy.navigateToTab(tabName));

  it('Should create a Strava Widget and add it to the dashboard', () => {
    cy.intercept('POST', '/widget/addWidget')
      .as('addWidget')
      .get('#openAddWidgetModal')
      .click()
      .get('#STRAVA')
      .click()
      .wait('@addWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.widget').should('have.length', 1);
      });
  });

  it('Should fail to load date because of wrong token', () => {
    window.localStorage.setItem('strava_token', null);
    window.localStorage.setItem('strava_refresh_token', null);
    window.localStorage.setItem(
      'strava_token_expires_at',
      TOKEN_EXPIRATION_DATE.toString()
    );
  });

  it('Should load the widget with a fake token', () => {
    window.localStorage.setItem('strava_refresh_token', STRAVA_REFRESH_TOKEN);
    window.localStorage.setItem('strava_token', STRAVA_TOKEN);
    window.localStorage.setItem(
      'strava_token_expires_at',
      TOKEN_EXPIRATION_DATE.toString()
    );
    cy.intercept('/stravaWidget/getRefreshToken')
      .as('refreshToken')
      .navigateToTab(tabName)
      .intercept('/stravaWidget/getAthleteData*')
      .as('getAthleteData')
      .intercept('/stravaWidget/getAthleteActivities*')
      .as('getActivities')
      .reload()
      .navigateToTab(tabName)
      .wait('@getAthleteData')
      .then((getAthleteDataRequest: Interception) => {
        const getAthleteResponse = getAthleteDataRequest.response;
        expect(getAthleteResponse.statusCode).to.equal(200);
        cy.wait('@getActivities').then((getActivitiesRequest: Interception) => {
          const getActivitiesResponse = getActivitiesRequest.response;
          expect(getActivitiesResponse.statusCode).to.equal(200);
          cy.get('.widget')
            .find('#stravaWidgetHeader')
            .should('have.text', 'Arnaud Flaesch')
            .get('.widget')
            .find('.stravaActivity')
            .should('have.length', 6)
            .first()
            .contains('Evening Run 10.7047 kms');
        });
      });
  });
});

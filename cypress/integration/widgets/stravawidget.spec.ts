/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Strava Widget tests', () => {
  const STRAVA_TOKEN = 'FAKE_TOKEN';
  const STRAVA_REFRESH_TOKEN = 'FAKE_REFRESH_TOKEN';
  const TOKEN_EXPIRATION_DATE = Date.now() + 3600;

  const GET_ATHLETE_DATA_URL = 'https://www.strava.com/api/v3/athlete';
  const GET_ACTIVITIES_DATA_URL =
    'https://www.strava.com/api/v3/athlete/activities?page=1&per_page=20';

  beforeEach(navigateToStravaTab);

  function navigateToStravaTab(): Cypress.Chainable {
    return cy
      .loginAsAdmin()
      .visit('/')
      .waitUntil(() => cy.get('.tab.selected-item').should('be.visible'))
      .get('.tab')
      .contains('Strava')
      .click();
  }

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
        cy.get('.widget').should('have.length', 2);
      });
  });

  it('Should fail to load date because of wrong token', () => {
    window.localStorage.setItem('strava_token', STRAVA_TOKEN);
    window.localStorage.setItem('strava_refresh_token', STRAVA_REFRESH_TOKEN);
    window.localStorage.setItem('strava_token_expires_at', TOKEN_EXPIRATION_DATE.toString());
    cy.intercept(GET_ATHLETE_DATA_URL)
      .as('getAthleteData')
      .intercept(GET_ACTIVITIES_DATA_URL)
      .as('getActivities')
      .reload();
    navigateToStravaTab();
    cy.wait('@getAthleteData').then((request: Interception) => {
      expect(request.response.statusCode).to.equal(401);
      cy.get('.mat-simple-snack-bar-content').should(
        'have.text',
        'Erreur lors de la récupération de vos informations.'
      );
    });
  });

  it('Should load the widget with a fake token', () => {
    window.localStorage.setItem('strava_refresh_token', STRAVA_REFRESH_TOKEN);
    cy.intercept('/stravaWidget/getRefreshToken').as('refreshToken');
    navigateToStravaTab();
    cy.wait('@refreshToken').then((requests: Interception) => {
      expect(requests.response.statusCode).to.equal(400);
      cy.get('.mat-simple-snack-bar-content').should(
        'have.text',
        "Vous n'êtes pas connecté à Strava."
      );
      window.localStorage.setItem('strava_token', STRAVA_TOKEN);
      window.localStorage.setItem('strava_token_expires_at', TOKEN_EXPIRATION_DATE.toString());
      cy.intercept(GET_ATHLETE_DATA_URL, {
        fixture: 'strava/strava_athleteData.json'
      })
        .as('getAthleteData')
        .intercept(GET_ACTIVITIES_DATA_URL, {
          fixture: 'strava/strava_activities.json'
        })
        .as('getActivities')
        .reload();
      navigateToStravaTab();
      cy.wait('@getAthleteData').then((getAthleteDataRequest: Interception) => {
        const getAthleteResponse = getAthleteDataRequest.response;
        expect(getAthleteResponse.statusCode).to.equal(200);
        cy.wait('@getActivities').then((getActivitiesRequest: Interception) => {
          const getActivitiesResponse = getActivitiesRequest.response;
          expect(getActivitiesResponse.statusCode).to.equal(200);
          cy.get('.widget')
            .eq(1)
            .find('#stravaWidgetHeader')
            .should('have.text', 'Arnaud Flaesch')
            .get('.widget')
            .eq(1)
            .find('.stravaActivity')
            .should('have.length', 5)
            .first()
            .contains('Afternoon Run 12.5188 kms');
        });
      });
    });
  });

  it('Should delete previously added widget', () => {
    cy.intercept('DELETE', '/widget/deleteWidget/*')
      .as('deleteWidget')
      .get('.deleteButton')
      .eq(1)
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

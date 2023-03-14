/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Steam Widget tests', () => {
  const tabName = 'Steam';
  const steamUserId = '1246578';

  before(() => cy.loginAsAdmin().createNewTab(tabName).createWidget('STEAM'));

  after(() => cy.loginAsAdmin().navigateToTab(tabName).deleteTab(tabName));

  beforeEach(() => {
    cy.loginAsAdmin()
      .navigateToTab(tabName)
      .intercept('GET', `/steamWidget/playerData*`)
      .as('getPlayerData')
      .intercept('GET', `/steamWidget/ownedGames*`)
      .as('getGameData')
      .intercept('GET', `/steamWidget/achievementList?steamUserId=${steamUserId}&appId=420`)
      .as('getAchievementData');
  });

  it('Should refresh Steam widget and validate data', () => {
    cy.get('.validateButton')
      .should('be.disabled')
      .get('#steamUserIdLabel')
      .click()
      .get('#steamUserIdInput')
      .type(steamUserId)
      .get('.validateButton')
      .click()
      .wait(['@getPlayerData', '@getGameData'])
      .then((requests: Interception[]) => {
        expect(requests[0].response.statusCode).to.equal(200);
        expect(requests[1].response.statusCode).to.equal(200);
        cy.get('.widget .game-info')
          .should('have.length', 25)
          .contains('Half-Life 2: Episode Two')
          .scrollIntoView()
          .click()
          .wait('@getAchievementData')
          .then((request: Interception) => {
            expect(request.response.statusCode).to.equal(200);
            cy.get('.widget .totalachievements')
              .should('have.text', 'Succès : 23')
              .get('.completedAchievements')
              .should('have.text', 'Succès complétés : 21')
              .get('.progress-value')
              .should('have.text', '91%');
          });
      });
  });
});

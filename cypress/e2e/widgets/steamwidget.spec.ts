/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Steam Widget tests', () => {
  const tabName = 'Steam';
  const steamUserId = '1246578';

  before(() => cy.createNewTab(tabName));

  after(() => cy.deleteTab(tabName));

  beforeEach(() => {
    cy.navigateToTab(tabName)
      .intercept('GET', `/steamWidget/playerData*`)
      .as('getPlayerData')
      .intercept('GET', `/steamWidget/ownedGames*`)
      .as('getGameData')
      .intercept('GET', `/steamWidget/achievementList?steamUserId=${steamUserId}&appId=420`)
      .as('getAchievementData');
  });

  it('Should create a Steam Widget and add it to the dashboard', () => {
    cy.intercept('POST', '/widget/addWidget')
      .as('addWidget')
      .get('#openAddWidgetModal')
      .click()
      .get('#STEAM')
      .click()
      .wait('@addWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.widget').should('have.length', 1);
      });
  });

  it('Should refresh Steam widget and validate data', () => {
    cy.get('.validateButton')
      .should('be.disabled')
      .get('input')
      .type(steamUserId)
      .get('.validateButton')
      .click()
      .wait(['@getPlayerData', '@getGameData'])
      .then((requests: Interception[]) => {
        expect(requests[0].response.statusCode).to.equal(200);
        expect(requests[1].response.statusCode).to.equal(200);
        cy.get('.widget .gameInfo')
          .should('have.length', 26)
          .contains('Half-Life 2: Episode Two')
          .scrollIntoView()
          .click()
          .wait('@getAchievementData')
          .then((request: Interception) => {
            expect(request.response.statusCode).to.equal(200);
            cy.get('.widget .totalachievements')
              .should('have.text', 'Succès : 23')
              .get('.completedAchievements')
              .should('have.text', 'Succès complétés : 19')
              .get('.progress-value')
              .should('have.text', '83%');
          });
      });
  });
});

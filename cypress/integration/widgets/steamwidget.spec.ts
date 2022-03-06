/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Steam Widget tests', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
      .visit('/')
      .title()
      .should('equals', 'Dash')
      .intercept('GET', `/steamWidget/playerData*`, {
        fixture: 'steam/playerData.json'
      })
      .as('getPlayerData')
      .intercept('GET', `/steamWidget/ownedGames*`, {
        fixture: 'steam/gameData.json'
      })
      .as('getGameData')
      .intercept('GET', `/steamWidget/achievementList?appId=420`, {
        fixture: 'steam/halfLife2Ep2Achievements.json'
      })
      .as('getAchievementData')
      .waitUntil(() => cy.get('.tab.selected-item').should('be.visible'))
      .get('.tab')
      .contains('Steam')
      .click();
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
        cy.get('.widget').should('have.length', 2);
      });
  });

  it('Should refresh Steam widget and validate data', () => {
    cy.wait(['@getPlayerData', '@getGameData']).then((requests: Interception[]) => {
      expect(requests[0].response.statusCode).to.equal(200);
      cy.get('.widget:nth(1) .gameInfo')
        .should('have.length', 10)
        .contains('Half-Life 2: Episode Two')
        .scrollIntoView()
        .click()
        .wait('@getAchievementData')
        .then((request: Interception) => {
          expect(request.response.statusCode).to.equal(200);
          cy.get('.widget:nth(1) .totalachievements')
            .should('have.text', 'Succès : 23')
            .get('.completedAchievements')
            .should('have.text', 'Succès complétés : 19')
            .get('.progress-value')
            .should('have.text', '83%');
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
      .click();
    cy.wait('@deleteWidget').then((request: Interception) => {
      expect(request.response.statusCode).to.equal(200);
      cy.get('.widget').should('have.length', 1);
    });
  });
});

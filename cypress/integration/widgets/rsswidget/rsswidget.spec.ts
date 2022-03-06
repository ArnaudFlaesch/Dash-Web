/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('RSS Widget tests', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
      .visit('/')
      .title()
      .should('equals', 'Dash')
      .waitUntil(() => cy.get('.tab.selected-item').should('be.visible'));
  });

  it('Should create a RSS Widget and add it to the dashboard', () => {
    cy.intercept('POST', '/widget/addWidget')
      .as('addWidget')
      .get('#openAddWidgetModal')
      .click()
      .get('#RSS')
      .click()
      .wait('@addWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.widget').should('have.length', 1);
      });
  });

  it('Should edit RSS widget and add a feed URL', () => {
    cy.intercept('GET', '/proxy/?url=https://www.lefigaro.fr/rss/figaro_actualites.xml', {
      fixture: 'figaro_rss.xml'
    })
      .as('refreshWidget')
      .get('.validateRssUrl')
      .should('be.disabled')
      .get('input')
      .type('https://www.lefigaro.fr/rss/figaro_actualites.xml')
      .get('.validateRssUrl')
      .click()
      .wait('@refreshWidget')
      .then(() => {
        cy.get('.rssTitle')
          .should('have.text', 'Le Figaro - Actualité en direct et informations en continu')
          .get('.rssArticle')
          .should('have.length', 20);
      });
  });

  it('Should read all articles', () => {
    cy.intercept('PATCH', '/widget/updateWidgetData/*')
      .as('markAllFeedAsRead')
      .intercept('GET', '/proxy/?url=https://www.lefigaro.fr/rss/figaro_actualites.xml', {
        fixture: 'figaro_rss.xml'
      })
      .as('refreshWidget')
      .get('.refreshButton')
      .click()
      .wait('@refreshWidget')
      .then(() => {
        cy.get('.rssArticle')
          .should('have.length', 20)
          .first()
          .contains(
            'EN DIRECT - Déconfinement : les Français savourent leur première soirée en terrasse'
          )
          .click()
          .get('.articleTitle:visible')
          .should(
            'have.text',
            'EN DIRECT - Déconfinement : les Français savourent leur première soirée en terrasse'
          )
          .get('.articleContent:visible')
          .should(
            'have.text',
            "La deuxième étape de l'allègement des restrictions sanitaires contre le Covid-19 commence ce mercredi. Le couvre-feu est repoussé de 19h à 21h."
          )
          .get('.rssArticle')
          .contains(
            'EN DIRECT - Déconfinement : les Français savourent leur première soirée en terrasse'
          )
          .should('have.class', 'read')
          .get('.rssArticle.read')
          .should('have.length', 1)
          .get('.markAllArticlesAsRead')
          .click()
          .wait('@markAllFeedAsRead')
          .then((request: Interception) => {
            expect(request.response.statusCode).to.equal(200);
            cy.get('.rssArticle.read').should('have.length', 20);
          });
      });
  });

  it('Should refresh all widgets', () => {
    cy.intercept('GET', '/proxy/?url=https://www.lefigaro.fr/rss/figaro_actualites.xml', {
      fixture: 'figaro_rss.xml'
    })
      .as('refreshWidget')
      .get('#reloadAllWidgetsButton')
      .click()
      .wait('@refreshWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.rssArticle').should('have.length', 20);
      });
  });

  it('Should delete previously added widget', () => {
    cy.intercept('GET', '/proxy/?url=https://www.lefigaro.fr/rss/figaro_actualites.xml', {
      fixture: 'figaro_rss.xml'
    })
      .as('getWidgetData')
      .intercept('DELETE', '/widget/deleteWidget/*')
      .as('deleteWidget')
      .wait('@getWidgetData')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.deleteButton')
          .click()
          .get('h4')
          .should('have.text', 'Êtes-vous sûr de vouloir supprimer ce widget ?')
          .get('.validateDeletionButton')
          .click()
          .wait('@deleteWidget')
          .then((request: Interception) => {
            expect(request.response.statusCode).to.equal(200);
            cy.get('.widget').should('have.length', 0);
          });
      });
  });
});

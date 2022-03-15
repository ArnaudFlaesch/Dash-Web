/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('RSS Widget tests', () => {
  const NUMBER_OF_ARTICLES = 17;

  beforeEach(() => {
    cy.loginAsAdmin()
      .visit('/')
      .title()
      .should('equals', 'Dash')
      .waitUntil(() => cy.get('.tab.selected-item').should('be.visible'))
      .intercept('GET', '/widget/?tabId=*')
      .as('getWidgets')
      .intercept('GET', '/rssWidget/?url=https://www.lefigaro.fr/rss/figaro_actualites.xml', {
        fixture: 'rss/figaro_rss.json'
      })
      .as('refreshWidget')
      .get('.tab')
      .contains('Flux RSS')
      .click()
      .wait('@getWidgets')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
      });
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
        cy.get('.widget').should('have.length', 2);
      });
  });

  it('Should edit RSS widget and add a feed URL', () => {
    cy.get('.validateButton')
      .should('be.disabled')
      .get('input')
      .type('https://www.lefigaro.fr/rss/figaro_actualites.xml')
      .get('.validateButton')
      .click()
      .wait('@refreshWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.rssTitle:nth(1)')
          .invoke('text')
          .then((text) => {
            expect(text.trim()).equal('Le Figaro - Actualité en direct et informations en continu');
          })
          .get('.widget:nth(1) .rss-article')
          .should('have.length', NUMBER_OF_ARTICLES);
      });
  });

  it('Should read all articles', () => {
    cy.intercept('PATCH', '/widget/updateWidgetData/*')
      .as('markAllFeedAsRead')
      .intercept('GET', '/rssWidget/?url=https://www.lefigaro.fr/rss/figaro_actualites.xml', {
        fixture: 'rss/figaro_rss.json'
      })
      .as('refreshWidget')
      .get('.refreshButton:nth(1)')
      .click()
      .wait('@refreshWidget')
      .then(() => {
        cy.get('.widget:nth(1) .rss-article')
          .should('have.length', NUMBER_OF_ARTICLES)
          .first()
          .contains(
            "EN DIRECT - Guerre en Ukraine : Poutine prévient qu'il atteindra ses objectifs «soit par la négociation, soit par la guerre»"
          )
          .click()
          .get('.widget:nth(1) .articleTitle')
          .should(
            'have.text',
            "EN DIRECT - Guerre en Ukraine : Poutine prévient qu'il atteindra ses objectifs «soit par la négociation, soit par la guerre»"
          )
          .get('.widget:nth(1) .articleContent')
          .invoke('text')
          .then((text) => {
            expect(text.trim()).equal(
              "Les présidents russe et français se sont de nouveau entretenus ce dimanche. Selon l'Élysée Vladimir Poutine a assuré ne pas vouloir attaquer les centrales nucléaires et nié «que son armée prenne des civils pour cible»."
            );
          })
          .get('.widget:nth(1) .rss-article')
          .contains(
            "EN DIRECT - Guerre en Ukraine : Poutine prévient qu'il atteindra ses objectifs «soit par la négociation, soit par la guerre»"
          )
          .get('.widget:nth(1) .mat-expansion-panel-header-title.is-read')
          .should('have.length', 1)
          .get('.widget:nth(1) .markAllArticlesAsRead')
          .click()
          .wait('@markAllFeedAsRead')
          .then((request: Interception) => {
            expect(request.response.statusCode).to.equal(200);
            cy.get('.widget:nth(1) .mat-expansion-panel-header-title.is-read').should(
              'have.length',
              NUMBER_OF_ARTICLES
            );
          });
      });
  });

  it('Should refresh all widgets', () => {
    cy.get('#reloadAllWidgetsButton')
      .click()
      .wait('@refreshWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.widget:nth(1) .rss-article').should('have.length', NUMBER_OF_ARTICLES);
      });
  });

  it('Should delete previously added widget', () => {
    cy.intercept('DELETE', '/widget/deleteWidget/*')
      .as('deleteWidget')
      .get('.widget:nth(1) .deleteButton')
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

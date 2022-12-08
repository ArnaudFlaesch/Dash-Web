/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('RSS Widget tests', () => {
  const NUMBER_OF_ARTICLES = 17;

  const tabName = 'Flux RSS';
  const rssFeedUrl = 'https://www.lefigaro.fr/rss/figaro_actualites.xml';

  before(() => cy.loginAsAdmin().createNewTab(tabName).createWidget('RSS'));

  after(() => cy.loginAsAdmin().deleteTab(tabName));

  beforeEach(() => {
    cy.intercept('GET', `/rssWidget/?url=${rssFeedUrl}`, {
      fixture: 'rss/figaro_rss.json'
    })
      .as('refreshWidget')
      .loginAsAdmin()
      .navigateToTab(tabName);
  });

  it('Should edit RSS widget and add a feed URL', () => {
    cy.get('.validateButton')
      .should('be.disabled')
      .get('input')
      .type(rssFeedUrl)
      .get('.validateButton')
      .click()
      .wait('@refreshWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.rssTitle')
          .invoke('text')
          .then((text) => {
            expect(text.trim()).equal(
              'Le Figaro - Actualité en direct et informations en continu'
            );
          })
          .get('.widget .rss-article')
          .should('have.length', NUMBER_OF_ARTICLES);
      });
  });

  it('Should read all articles', () => {
    cy.intercept('PATCH', '/widget/updateWidgetData/*')
      .as('markAllFeedAsRead')
      .intercept('GET', `/rssWidget/?url=${rssFeedUrl}`, {
        fixture: 'rss/figaro_rss.json'
      })
      .as('refreshWidget')
      .get('.refreshButton')
      .click()
      .wait('@refreshWidget')
      .then(() => {
        cy.get('.widget .rss-article')
          .should('have.length', NUMBER_OF_ARTICLES)
          .waitUntil(() =>
            cy
              .get('.widget .rss-article:nth(0)  .articleTitle')
              .should('be.visible')
          )
          .get('.widget .rss-article:nth(0)')
          .click()
          .get('.widget .rss-article:nth(0) .rssPanelArticleTitle')
          .invoke('text')
          .then((text) => {
            expect(text.trim()).equal(
              "EN DIRECT - Guerre en Ukraine : Poutine prévient qu'il atteindra ses objectifs «soit par la négociation, soit par la guerre»"
            );
          })
          .get('.widget .articleContent')
          .invoke('text')
          .then((text) => {
            expect(text.trim()).equal(
              "Les présidents russe et français se sont de nouveau entretenus ce dimanche. Selon l'Élysée Vladimir Poutine a assuré ne pas vouloir attaquer les centrales nucléaires et nié «que son armée prenne des civils pour cible»."
            );
          })
          .get('.widget .rss-article')
          .contains(
            "EN DIRECT - Guerre en Ukraine : Poutine prévient qu'il atteindra ses objectifs «soit par la négociation, soit par la guerre»"
          )
          .get('.widget .mat-expansion-panel-header-title.is-read')
          .should('have.length', 1)
          .get('.widget .markAllArticlesAsReadButton')
          .click()
          .wait('@markAllFeedAsRead')
          .then((request: Interception) => {
            expect(request.response.statusCode).to.equal(200);
            cy.get('.widget .mat-expansion-panel-header-title.is-read').should(
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
        cy.get('.widget .rss-article').should(
          'have.length',
          NUMBER_OF_ARTICLES
        );
      });
  });

  it('Should fail to delete a created widget', () => {
    cy.get('.widget')
      .should('have.length', 1)
      .intercept('DELETE', '/widget/deleteWidget/*', { statusCode: 500 })
      .as('deleteWidgetError')
      .get('.deleteButton')
      .click()
      .get('h4')
      .should('have.text', 'Êtes-vous sûr de vouloir supprimer ce widget ?')
      .get('.validateDeletionButton')
      .click()
      .wait('@deleteWidgetError')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(500);
        cy.get('.mat-simple-snack-bar-content')
          .should('have.text', "Erreur lors de la suppression d'un widget.")
          .get('.widget')
          .should('have.length', 1);
      });
  });
});

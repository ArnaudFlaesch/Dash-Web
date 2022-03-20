/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Calendar Widget tests', () => {
  const icalFrenchHolidays =
    'https://calendar.google.com/calendar/ical/fr.french%23holiday%40group.v.calendar.google.com/public/basic.ics';
  const icalUsaHolidays =
    'https://calendar.google.com/calendar/ical/fr.usa%23holiday%40group.v.calendar.google.com/public/basic.ics';

  beforeEach(() => {
    cy.loginAsAdmin()
      .clock(new Date(2021, 6, 1, 0, 0, 0).getTime())
      .visit('/')
      .waitUntil(() => cy.get('.tab.selected-item').should('be.visible'))
      .get('.tab')
      .contains('Agenda')
      .click();
  });

  it('Should create a Calendar Widget and add it to the dashboard', () => {
    cy.intercept('POST', '/widget/addWidget')
      .as('addWidget')
      .get('#openAddWidgetModal')
      .click()
      .get('#CALENDAR')
      .click()
      .wait('@addWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.widget').should('have.length', 1);
      });
  });

  it('Should edit Calendar widget and add an Ical feed', () => {
    cy.intercept('POST', `/calendarWidget/`)
      .as('getCalendarDataRequest')
      .get('#addCalendarUrl')
      .click()
      .get('input')
      .type(`${icalFrenchHolidays}`)
      .get('.validateButton')
      .click()
      .wait('@getCalendarDataRequest')
      .then(() => {
        cy.get('h3')
          .should('have.text', 'juillet 2021')
          .get('.refreshButton')
          .click()
          .wait('@getCalendarDataRequest')
          .then(() => {
            cy.get('.cal-future:nth(14) .cal-day-badge')
              .should('have.text', 1)
              .get('.editButton')
              .click()
              .get('#addCalendarUrl')
              .click()
              .get('input')
              .eq(1)
              .type(`${icalUsaHolidays}`)
              .get('.validateButton')
              .click();
            cy.wait(['@getCalendarDataRequest', '@getCalendarDataRequest']).then(() => {
              cy.get('.cal-future:nth(4) .cal-day-badge')
                .get('.editButton')
                .click()
                .get('.removeCalendarUrl')
                .eq(1)
                .click()
                .get('.validateButton')
                .click()
                .wait('@getCalendarDataRequest')
                .then(() =>
                  cy
                    .get('.cal-day-badge')
                    .should('have.length', 2)
                    .clock()
                    .then((clock) => {
                      clock.restore();
                    })
                );
            });
          });
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
        cy.get('.widget').should('have.length', 0);
      });
  });
});

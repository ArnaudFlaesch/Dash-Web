/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Calendar Widget tests', () => {
  const icalFrenchHolidays =
    'https://calendar.google.com/calendar/ical/fr.french%23holiday%40group.v.calendar.google.com/public/basic.ics';
  const icalUsaHolidays =
    'https://calendar.google.com/calendar/ical/fr.usa%23holiday%40group.v.calendar.google.com/public/basic.ics';

  const tabName = 'Agenda';

  before(() => cy.loginAsAdmin().createNewTab(tabName).createWidget('CALENDAR'));

  after(() => cy.loginAsAdmin().navigateToTab(tabName).deleteTab(tabName));

  beforeEach(() => {
    // July 1st 2022
    cy.clock(new Date(2023, 6, 1, 0, 0, 0).getTime())
      .loginAsAdmin()
      .navigateToTab(tabName);
  });

  it('Should edit Calendar widget and add an Ical feed', () => {
    cy.intercept('POST', `/calendarWidget/`)
      .as('getCalendarDataRequest')
      .get('#addCalendarUrl')
      .click();
    cy.get('input').type(`${icalFrenchHolidays}`);
    cy.get('.validateButton').click();
    cy.wait('@getCalendarDataRequest').then((request: Interception) => {
      expect(request.response.statusCode).to.equal(200);
      cy.get('h3').should('have.text', 'juillet 2022');
      cy.get('.refreshButton').click();
      cy.wait('@getCalendarDataRequest').then(() => {
        cy.get('.cal-future:nth(14)').find('.cal-day-badge').should('have.text', 1);
        cy.get('.editButton').click();
        cy.get('#addCalendarUrl').click();
        cy.get('input').eq(1).type(`${icalUsaHolidays}`);
        cy.get('.validateButton').click();
        cy.wait(['@getCalendarDataRequest', '@getCalendarDataRequest']).then(
          (request: Interception[]) => {
            expect(request[0].response.statusCode).to.equal(200);
            expect(request[1].response.statusCode).to.equal(200);
            cy.get('.cal-future:nth(4)').scrollIntoView();
            cy.get('.editButton').click();
            cy.get('.removeCalendarUrl').eq(1).click();
            cy.get('.validateButton').click();
            cy.wait('@getCalendarDataRequest').then(() =>
              cy
                .get('.cal-day-badge')
                .should('have.length', 1)
                .clock()
                .then((clock) => {
                  clock.restore();
                })
            );
          }
        );
      });
    });
  });
});

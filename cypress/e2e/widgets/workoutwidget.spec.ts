/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Workout Widget tests', () => {
  const mockedDate = new Date(2022, 6, 22, 0, 0, 0);
  const tabName = 'Workout';

  before(() => cy.loginAsAdmin().createNewTab(tabName).createWidget('WORKOUT'));

  after(() => cy.loginAsAdmin().navigateToTab(tabName).deleteTab(tabName));

  beforeEach(() => cy.clock(mockedDate.getTime()).loginAsAdmin().navigateToTab(tabName));

  afterEach(() =>
    cy.clock().then((clock) => {
      clock.restore();
    })
  );

  it('Should add a new workout type', () => {
    const newWorkoutTypeName = 'Abdos';
    cy.intercept('POST', `/workoutWidget/addWorkoutType`).as('addWorkoutType');
    cy.get('.workoutTypeName')
      .should('have.length', 0)
      .get('.workout-session')
      .should('have.length', 0)
      .get('#addWorkoutInput')
      .type(newWorkoutTypeName);
    cy.get('#addWorkoutTypeButton').click();
    cy.wait('@addWorkoutType').then((request: Interception) => {
      expect(request.response.statusCode).to.equal(200);
      cy.get('.workoutTypeName')
        .should('have.length', 1)
        .invoke('text')
        .then((text) => {
          expect(text.trim()).equal(newWorkoutTypeName);
        });
    });
  });

  it('Should add a new workout session', () => {
    cy.intercept('POST', `/workoutWidget/createWorkoutSession`).as('createWorkoutSession');
    cy.get('.workoutTypeName')
      .should('have.length', 1)
      .get('.workout-session')
      .should('have.length', 0)
      .get('#workoutDatePickerField .mat-datepicker-toggle')
      .click();
    cy.get('.mat-calendar-body-today').click();
    cy.waitUntil(() =>
      cy
        .get('.cdk-overlay-backdrop')
        .eq(0)
        .should('not.be.visible')
        .then(() => {
          cy.get('#createWorkoutSessionButton').click();
          cy.wait('@createWorkoutSession').then((request: Interception) => {
            expect(request.response.statusCode).to.equal(200);
            const month = mockedDate.getMonth() + 1; // Nécessaire car getMonth renvoie 6 au lieu de 07
            const dateText = `${mockedDate.getDate()}/0${month}/${mockedDate.getFullYear()}`;
            cy.get('#workoutSessionDate').should('have.text', `Session du ${dateText}`);
          });
        })
    );
  });

  it('Should add a new workout exercise', () => {
    cy.intercept('GET', '/workoutWidget/workoutExercises?workoutSessionId*')
      .as('getWorkoutExercises')
      .intercept('POST', `/workoutWidget/addWorkoutExercise`)
      .as('addWorkoutExercise');
    cy.get('.workout-session').should('have.length', 1);
    cy.get('.workout-session:nth(0)').click();
    cy.wait('@getWorkoutExercises').then((request: Interception) => {
      expect(request.response.statusCode).to.equal(200);
      cy.get('#workoutSessionDate')
        .should('have.text', `Session du 22/07/2022`)
        .intercept('POST', '/workoutWidget/updateWorkoutExercise')
        .as('updateWorkoutExercise')
        .get('#edit-session-button')
        .click();
      cy.get('.addRepToWorkoutButton').click();
      cy.wait('@updateWorkoutExercise').then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        expect(request.response.body.numberOfReps).to.equal(1);
        cy.get('.workout-number-of-reps').should('have.text', 1);
      });
    });
  });
});

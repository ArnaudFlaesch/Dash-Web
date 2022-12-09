/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Workout Widget tests', () => {
  const mockedDateTime = new Date(2022, 6, 22, 0, 0, 0).getTime();
  const tabName = 'Workout';

  before(() => cy.loginAsAdmin().createNewTab(tabName).createWidget('WORKOUT'));

  after(() => cy.loginAsAdmin().deleteTab(tabName));

  beforeEach(() =>
    cy.clock(mockedDateTime).loginAsAdmin().navigateToTab(tabName)
  );

  afterEach(() =>
    cy.clock().then((clock) => {
      clock.restore();
    })
  );

  it('Should add a new workout type', () => {
    const newWorkoutTypeName = 'Abdos';
    cy.intercept('POST', `/workoutWidget/addWorkoutType`)
      .as('addWorkoutType')
      .get('.workoutTypeName')
      .should('have.length', 0)
      .get('.workout-session')
      .should('have.length', 0)
      .get('#addWorkoutInput')
      .type(newWorkoutTypeName)
      .get('#addWorkoutTypeButton')
      .click()
      .wait('@addWorkoutType')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.workoutTypeName')
          .should('have.length', 1)
          .should('have.text', newWorkoutTypeName);
      });
  });

  it('Should add a new workout session', () => {
    cy.intercept('POST', `/workoutWidget/createWorkoutSession`)
      .as('createWorkoutSession')
      .get('.workoutTypeName')
      .should('have.length', 1)
      .get('.workout-session')
      .should('have.length', 0)
      .get('#workoutDatePickerField .mat-datepicker-toggle')
      .click()
      .get('.mat-calendar-body-today')
      .click()
      .get('#createWorkoutSessionButton')
      .click()
      .wait('@createWorkoutSession')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.workout-session').should('have.length', 1);
      });
  });

  it('Should add a new workout exercise', () => {
    cy.intercept('GET', '/workoutWidget/workoutExercises?workoutSessionId*')
      .as('getWorkoutExercises')
      .intercept('POST', `/workoutWidget/addWorkoutExercise`)
      .as('addWorkoutExercise')
      .get('.workout-session')
      .should('have.length', 1)
      .get('.workout-session:nth(0)')
      .click()
      .wait('@getWorkoutExercises')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('#workoutSessionDate')
          .should('have.text', `Session du 22/07/2022`)
          .intercept('POST', '/workoutWidget/updateWorkoutExercise')
          .as('updateWorkoutExercise')
          .get('.addRepToWorkoutButton')
          .click()
          .wait('@updateWorkoutExercise')
          .then((request: Interception) => {
            expect(request.response.statusCode).to.equal(200);
            expect(request.response.body.numberOfReps).to.equal(1);
            cy.get('.workoutNumberOfReps').should('have.text', 1);
          });
      });
  });
});

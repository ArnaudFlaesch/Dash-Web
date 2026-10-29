/// <reference types="cypress" />

import { Interception } from "cypress/types/net-stubbing";
import { format } from "date-fns";

describe("Workout Widget tests", () => {
  const mockedDate = new Date(2023, 6, 22, 0, 0, 0);
  const tabName = "Workout";

  before(() => cy.loginAsAdmin().createNewTab(tabName).createWidget("WORKOUT"));

  after(() => cy.loginAsAdmin().navigateToTab(tabName).deleteTab(tabName));

  beforeEach(() => {
    cy.clock(mockedDate.getTime(), ["Date"]);
    cy.loginAsAdmin().navigateToTab(tabName);
  });

  afterEach(() =>
    cy.clock().then((clock) => {
      clock.restore();
    })
  );

  it("Should add a new workout type", () => {
    const newWorkoutTypeName = "Abdos";
    cy.intercept("POST", `/workoutWidget/addWorkoutType`).as("addWorkoutType");
    cy.get(".workout-type-name").should("have.length", 0);
    cy.get(".workout-session").should("have.length", 0);
    cy.get("#add-workout-input").type(newWorkoutTypeName);
    cy.get("#add-workout-type-button").click();
    cy.wait("@addWorkoutType").then((request: Interception) => {
      expect(request.response?.statusCode).to.equal(200);
      cy.get(".workout-type-name")
        .should("have.length", 1)
        .invoke("text")
        .then((text) => {
          expect(text.trim()).equal(newWorkoutTypeName);
        });
    });
  });

  it("Should add a new workout session", () => {
    cy.intercept("POST", `/workoutWidget/createWorkoutSession`).as("createWorkoutSession");
    cy.get(".workout-type-name").should("have.length", 1);
    cy.get(".workout-session").should("have.length", 0);
    cy.get("#workout-date-picker-field").type(format(mockedDate, "dd/MM/yyyy"));
    cy.get("#create-workout-session-button")
      .should("be.visible")
      .then(() => {
        cy.get("#create-workout-session-button").click();
        cy.wait("@createWorkoutSession").then((request: Interception) => {
          expect(request.response?.statusCode).to.equal(200);
          const month = mockedDate.getMonth() + 1; // Nécessaire car getMonth renvoie 6 au lieu de 07
          const dateText = `${mockedDate.getDate()}/0${month}/${mockedDate.getFullYear()}`;
          cy.get("#workout-session-date").should("have.text", `Session du ${dateText}`);
        });
      });
  });

  it("Should add a new workout exercise", () => {
    cy.intercept("GET", "/workoutWidget/workoutExercises?workoutSessionId*").as(
      "getWorkoutExercises"
    );
    cy.intercept("POST", `/workoutWidget/addWorkoutExercise`).as("addWorkoutExercise");
    cy.get(".workout-session").should("have.length", 1);
    cy.get(".workout-session:nth(0)").click();
    cy.wait("@getWorkoutExercises").then((request: Interception) => {
      expect(request.response?.statusCode).to.equal(200);
      cy.get("#workout-session-date")
        .should("have.text", `Session du 22/07/${mockedDate.getFullYear()}`)
        .intercept("POST", "/workoutWidget/updateWorkoutExercise")
        .as("updateWorkoutExercise")
        .get("#edit-session-button")
        .click();
      cy.get(".add-rep-to-workout-button").click();
      cy.wait("@updateWorkoutExercise").then((request: Interception) => {
        expect(request.response?.statusCode).to.equal(200);
        expect(request.response?.body?.numberOfReps).to.equal(1);
        cy.get(".workout-number-of-reps").should("have.text", 1);
      });
    });
  });
});

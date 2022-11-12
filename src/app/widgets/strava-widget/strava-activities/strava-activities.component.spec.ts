import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StravaActivitiesComponent } from './strava-activities.component';

describe('StravaActivitiesComponent', () => {
  let component: StravaActivitiesComponent;
  let fixture: ComponentFixture<StravaActivitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StravaActivitiesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StravaActivitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

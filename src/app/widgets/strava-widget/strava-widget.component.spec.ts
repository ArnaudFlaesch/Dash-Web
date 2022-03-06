import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StravaWidgetComponent } from './strava-widget.component';

describe('StravaWidgetComponent', () => {
  let component: StravaWidgetComponent;
  let fixture: ComponentFixture<StravaWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StravaWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StravaWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

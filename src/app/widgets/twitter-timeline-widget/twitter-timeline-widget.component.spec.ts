import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwitterTimelineWidgetComponent } from './twitter-timeline-widget.component';

describe('TwitterTimelineWidgetComponent', () => {
  let component: TwitterTimelineWidgetComponent;
  let fixture: ComponentFixture<TwitterTimelineWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TwitterTimelineWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwitterTimelineWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

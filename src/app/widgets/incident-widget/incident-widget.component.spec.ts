import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentWidgetComponent } from './incident-widget.component';

describe('IncidentWidgetComponent', () => {
  let component: IncidentWidgetComponent;
  let fixture: ComponentFixture<IncidentWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IncidentWidgetComponent]
    });
    fixture = TestBed.createComponent(IncidentWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

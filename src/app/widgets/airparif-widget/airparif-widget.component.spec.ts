import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirparifWidgetComponent } from './airparif-widget.component';

describe('AirparifWidgetComponent', () => {
  let component: AirparifWidgetComponent;
  let fixture: ComponentFixture<AirparifWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AirparifWidgetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AirparifWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

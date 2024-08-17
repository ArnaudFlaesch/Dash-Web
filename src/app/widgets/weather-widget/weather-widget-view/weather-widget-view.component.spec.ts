import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeatherWidgetViewComponent } from './weather-widget-view.component';

describe('WeatherWidgetViewComponent', () => {
  let component: WeatherWidgetViewComponent;
  let fixture: ComponentFixture<WeatherWidgetViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherWidgetViewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherWidgetViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

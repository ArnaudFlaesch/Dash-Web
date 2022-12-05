import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EcowattWidgetComponent } from './ecowatt-widget.component';

describe('EcowattWidgetComponent', () => {
  let component: EcowattWidgetComponent;
  let fixture: ComponentFixture<EcowattWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EcowattWidgetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EcowattWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

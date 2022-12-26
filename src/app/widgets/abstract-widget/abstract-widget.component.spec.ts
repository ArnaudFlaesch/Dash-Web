import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbstractWidgetComponent } from './abstract-widget.component';

describe('AbstractWidgetComponent', () => {
  let component: AbstractWidgetComponent;
  let fixture: ComponentFixture<AbstractWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AbstractWidgetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AbstractWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

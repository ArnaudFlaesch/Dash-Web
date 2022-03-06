import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWidgetModalComponent } from './create-widget-modal.component';

describe('CreateWidgetModalComponent', () => {
  let component: CreateWidgetModalComponent;
  let fixture: ComponentFixture<CreateWidgetModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateWidgetModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateWidgetModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { CreateMiniWidgetModalComponent } from './create-mini-widget-modal.component';

describe('CreateMiniWidgetModalComponent', () => {
  let component: CreateMiniWidgetModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      providers: [{ provide: MatDialogRef, useValue: {} }]
    }).compileComponents();

    const fixture = TestBed.createComponent(CreateMiniWidgetModalComponent);
    component = fixture.componentInstance;
  });

  it('Should create the component', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportConfigModalComponent } from './import-config-modal.component';

describe('ImportConfigModalComponent', () => {
  let component: ImportConfigModalComponent;
  let fixture: ComponentFixture<ImportConfigModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportConfigModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportConfigModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

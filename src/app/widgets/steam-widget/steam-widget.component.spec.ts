import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SteamWidgetComponent } from './steam-widget.component';

describe('SteamWidgetComponent', () => {
  let component: SteamWidgetComponent;
  let fixture: ComponentFixture<SteamWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SteamWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SteamWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

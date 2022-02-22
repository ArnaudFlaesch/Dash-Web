import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RssWidgetComponent } from './rss-widget.component';

describe('RssWidgetComponent', () => {
  let component: RssWidgetComponent;
  let fixture: ComponentFixture<RssWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RssWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RssWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

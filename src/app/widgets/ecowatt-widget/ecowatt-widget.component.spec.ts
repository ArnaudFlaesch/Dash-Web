import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { WidgetService } from '../../services/widget.service/widget.service';
import { EcowattWidgetComponent } from './ecowatt-widget.component';

describe('EcowattWidgetComponent', () => {
  let component: EcowattWidgetComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ErrorHandlerService, WidgetService, { provide: 'widgetId', useValue: 1 }]
    }).compileComponents();

    const fixture = TestBed.createComponent(EcowattWidgetComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.refreshWidget();
    expect(component.getWidgetData()).toEqual({});
  });
});

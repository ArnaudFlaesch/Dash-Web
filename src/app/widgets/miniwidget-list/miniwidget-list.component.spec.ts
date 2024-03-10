import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { MiniWidgetTypeEnum } from '../../enums/MiniWidgetTypeEnum';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { MiniWidgetService } from '../../services/widget.service/miniwidget.service';
import { MiniWidgetListComponent } from './miniwidget-list.component';

describe('MiniWidgetListComponent', () => {
  let component: MiniWidgetListComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule, MatSnackBarModule, HttpClientTestingModule],
      providers: [MiniWidgetService, ErrorHandlerService]
    }).compileComponents();

    const fixture = TestBed.createComponent(MiniWidgetListComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should have no widgets', () => {
    component.ngOnInit();
    const request = httpTestingController.expectOne(environment.backend_url + '/miniWidget/');
    request.flush([
      {
        id: 70,
        type: MiniWidgetTypeEnum.WEATHER
      }
    ]);
    expect(component.miniWidgetList.length).toEqual(1);
  });
});

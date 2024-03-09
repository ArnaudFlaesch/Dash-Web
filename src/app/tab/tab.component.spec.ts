import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpMethod } from '@ngneat/spectator/jest';
import { environment } from '../../environments/environment';
import { TabService } from '../services/tab.service/tab.service';
import { ITab } from './../model/Tab';
import { ErrorHandlerService } from './../services/error.handler.service';
import { TabComponent } from './tab.component';

describe('TabComponent', () => {
  let component: TabComponent;
  let httpTestingController: HttpTestingController;

  const tabData: ITab = {
    id: 1,
    label: 'Flux RSS',
    tabOrder: 1
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatSnackBarModule, HttpClientTestingModule],
      providers: [ErrorHandlerService, TabService]
    }).compileComponents();

    const fixture = TestBed.createComponent(TabComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('Simple cases', () => {
    it('Should display and edit a tab', () => {
      expect(component.tab).toEqual(undefined);
      component.tab = tabData;
      expect(component.editMode).toEqual(false);
      component.toggleEditMode();
      expect(component.editMode).toEqual(true);
      const updatedTabLabel = 'Journaux';
      component.tab.label = updatedTabLabel;
      component.enterSaveTabName(new KeyboardEvent('keydown', { key: 'Enter' }));
      const updatedTabData = {
        id: 1,
        label: updatedTabLabel,
        tabOrder: 1
      };
      const request = httpTestingController.expectOne(
        environment.backend_url + '/tab/updateTab',
        HttpMethod.POST
      );
      request.flush(updatedTabData);
      expect(component.editMode).toEqual(false);
    });

    it('Should delete a tab when it exists', () => {
      const deletedEventSpy = jest.spyOn(component.tabDeletedEvent, 'emit');
      component.deleteTabFromDash();
      expect(deletedEventSpy).toHaveBeenCalledTimes(0);
      component.tab = {
        id: 1,
        label: 'Nouvel onglet',
        tabOrder: 1
      } as ITab;
      component.deleteTabFromDash();
      expect(deletedEventSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error cases', () => {
    it('Should log error on save tab name when server throws an error', () => {
      // const errorHandlerService = jest.mock(ErrorHandlerService);
      /*
      spectator = createComponent({
        providers: [{ provide: ErrorHandlerService, useValue: errorHandlerService }]
      });
*/

      component.saveTabName(1, 'Nouveau label', 1);

      httpTestingController
        .expectOne(environment.backend_url + '/tab/updateTab')
        .error(new ProgressEvent('Server error'));

      expect(component.errorHandlerService.handleError).toHaveBeenCalledTimes(1);
    });
  });
});

import { ITab } from './../model/Tab';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { ErrorHandlerService } from './../services/error.handler.service';
import { TabService } from './../services/tab.service/tab.service';
import { TabComponent } from './tab.component';
import { environment } from '../../environments/environment';

describe('TabComponent', () => {
  let spectator: Spectator<TabComponent>;
  let tabService: SpectatorHttp<TabService>;

  const tabData: ITab = {
    id: 1,
    label: 'Flux RSS',
    tabOrder: 1
  };

  const createComponent = createComponentFactory({
    component: TabComponent,
    imports: [MatSnackBarModule],
    providers: [ErrorHandlerService],
    schemas: [NO_ERRORS_SCHEMA]
  });
  const createHttp = createHttpFactory(TabService);

  beforeEach(() => {
    spectator = createComponent();
    tabService = createHttp();
  });

  it('Should display and edit a tab', () => {
    expect(spectator.component.tab).toEqual(undefined);
    spectator.component.tab = tabData;
    expect(spectator.component.editMode).toEqual(false);
    spectator.component.toggleEditMode();
    expect(spectator.component.editMode).toEqual(true);
    const updatedTabLabel = 'Journaux';
    spectator.component.tab.label = updatedTabLabel;
    spectator.component.enterSaveTabName(
      new KeyboardEvent('keydown', { key: 'Enter' })
    );
    const updatedTabData = {
      id: 1,
      label: updatedTabLabel,
      tabOrder: 1
    };
    const request = tabService.expectOne(
      environment.backend_url + '/tab/updateTab',
      HttpMethod.POST
    );
    request.flush(updatedTabData);
    expect(spectator.component.editMode).toEqual(false);
    spectator.detectChanges();
    expect(spectator.query('.tabLabel')?.textContent?.trim()).toEqual(
      updatedTabLabel
    );
  });

  it('Should delete a tab when it exists', () => {
    const deletedEventSpy = jest.spyOn(
      spectator.component.tabDeletedEvent,
      'emit'
    );
    spectator.component.deleteTabFromDash();
    expect(deletedEventSpy).toBeCalledTimes(0);
    spectator.component.tab = {
      id: 1,
      label: 'Nouvel onglet',
      tabOrder: 1
    } as ITab;
    spectator.component.deleteTabFromDash();
    expect(deletedEventSpy).toBeCalledTimes(1);
  });
});

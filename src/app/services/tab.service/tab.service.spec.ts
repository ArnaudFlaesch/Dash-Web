import { createHttpFactory, HttpMethod, SpectatorHttp } from '@ngneat/spectator/jest';
import { environment } from '../../../environments/environment';
import { TabService } from './tab.service';

describe('ApiService tests', () => {
  let spectator: SpectatorHttp<TabService>;
  const createSpectator = createHttpFactory({
    service: TabService
  });

  const tabPath = '/tab/';

  beforeEach(() => (spectator = createSpectator()));

  it('Devrait retourner deux onglets', () => {
    const expectedTabData = [
      { id: 1, label: 'Flux RSS', tabOrder: 1 },
      { id: 2, label: 'Météo', tabOrder: 2 }
    ];

    spectator.service.getTabs().subscribe((response) => expect(response).toEqual(expectedTabData));

    const request = spectator.expectOne(environment.backend_url + tabPath, HttpMethod.GET);
    request.flush(expectedTabData);
  });

  it('Devrait créer un onglet', () => {
    const expectedNewTab = { id: 1, label: 'Nouvel onglet', tabOrder: 3 };
    const tabLabel = 'Nouvel onglet';

    spectator.service
      .addTab(tabLabel)
      .subscribe((response) => expect(response).toEqual(expectedNewTab));

    const request = spectator.expectOne(
      environment.backend_url + tabPath + 'addTab',
      HttpMethod.POST
    );
    request.flush(expectedNewTab);
  });

  it('Devrait mettre à jour un onglet', () => {
    const expectedUpdatedTab = { id: 1, label: 'Updated onglet', tabOrder: 3 };

    spectator.service
      .updateTab(expectedUpdatedTab.id, expectedUpdatedTab.label, expectedUpdatedTab.tabOrder)
      .subscribe((response) => expect(response).toEqual(expectedUpdatedTab));

    const request = spectator.expectOne(
      environment.backend_url + tabPath + 'updateTab',
      HttpMethod.POST
    );
    request.flush(expectedUpdatedTab);
  });

  it('Devrait mettre à jour un onglet', () => {
    const expectedUpdatedTabs = [
      { id: 1, label: 'Updated onglet', tabOrder: 3 },
      { id: 1, label: 'Updated onglet 2', tabOrder: 4 }
    ];

    spectator.service
      .updateTabs(expectedUpdatedTabs)
      .subscribe((response) => expect(response).toEqual(expectedUpdatedTabs));

    const request = spectator.expectOne(
      environment.backend_url + tabPath + 'updateTabs',
      HttpMethod.POST
    );
    request.flush(expectedUpdatedTabs);
  });

  it('Devrait supprimer un onglet', () => {
    const tabId = 1;
    spectator.service.deleteTab(tabId).subscribe((response) => expect(response).toEqual(true));

    const request = spectator.expectOne(
      environment.backend_url + tabPath + 'deleteTab/?id=' + tabId,
      HttpMethod.DELETE
    );
    request.flush(true);
  });
});

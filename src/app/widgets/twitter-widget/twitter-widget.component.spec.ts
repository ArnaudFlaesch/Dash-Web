import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { ErrorHandlerService } from '../../services/error.handler.service';

import { IFollowedUser } from './ITwitter';
import { TwitterWidgetComponent } from './twitter-widget.component';
import { TwitterWidgetService } from './twitter.widget.service';

describe('TwitterWidgetComponent', () => {
  let spectator: Spectator<TwitterWidgetComponent>;
  let twitterWidgetService: SpectatorHttp<TwitterWidgetService>;

  const createComponent = createComponentFactory({
    component: TwitterWidgetComponent,
    imports: [MatSnackBarModule],
    providers: [TwitterWidgetService, ErrorHandlerService],
    schemas: []
  });
  const createHttp = createHttpFactory(TwitterWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    twitterWidgetService = createHttp();
  });

  const followedUserData = { id: 1, userHandle: 'Nono' } as IFollowedUser;

  it('should add followed user', () => {
    expect(spectator.component.followedUsers).toEqual([]);
    spectator.component.searchFormControl.setValue('Nono');
    spectator.component.addFollowedUser();

    const addFollowedUserRequest = twitterWidgetService.expectOne(
      `${environment.backend_url}/twitterWidget/addFollowedUser`,
      HttpMethod.POST
    );

    addFollowedUserRequest.flush(followedUserData);

    expect(spectator.component.followedUsers).toEqual([followedUserData]);
  });

  it('Should search followed users', () => {
    expect(spectator.component.followedUsers).toEqual([]);
    spectator.component.searchFormControl.setValue('test', {
      onlySelf: false,
      emitEvent: true
    });
    const searchFollowedUsersRequest = twitterWidgetService.expectOne(
      `${environment.backend_url}/twitterWidget/followed`,
      HttpMethod.GET
    );

    searchFollowedUsersRequest.flush([]);

    expect(spectator.component.followedUsers).toEqual([]);
  });

  it('Should select a followed user and delete it', () => {
    spectator.component.followedUsers = [followedUserData];

    spectator.component.selectUserHandle(followedUserData.userHandle);
    expect(spectator.component.selectedTwitterHandle).toEqual(
      followedUserData.userHandle
    );

    spectator.component.deleteFollowedUser(followedUserData.id);

    const removeFollowedUserRequest = twitterWidgetService.expectOne(
      `${environment.backend_url}/twitterWidget/deleteFollowedUser?followedUserId=${followedUserData.id}`,
      HttpMethod.DELETE
    );

    removeFollowedUserRequest.flush(null);

    expect(spectator.component.followedUsers).toEqual([]);
  });
});

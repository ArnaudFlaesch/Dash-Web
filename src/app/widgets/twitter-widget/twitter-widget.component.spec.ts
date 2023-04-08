import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';

import { IPage } from '../../../app/model/IPage';
import { environment } from '../../../environments/environment';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { ThemeService } from '../../services/theme.service/theme.service';
import { IFollowedUser } from './ITwitter';
import { TwitterWidgetComponent } from './twitter-widget.component';
import { TwitterWidgetService } from './twitter.widget.service';

describe('TwitterWidgetComponent', () => {
  let spectator: Spectator<TwitterWidgetComponent>;
  let twitterWidgetService: SpectatorHttp<TwitterWidgetService>;

  describe('Normal tests', () => {
    const createComponent = createComponentFactory({
      component: TwitterWidgetComponent,
      imports: [MatSnackBarModule],
      providers: [TwitterWidgetService, ErrorHandlerService, ThemeService],
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

    it('Should search followed users', (done) => {
      expect(spectator.component.followedUsers).toEqual([]);
      spectator.component.searchFormControl.setValue('test', {
        onlySelf: false,
        emitEvent: true
      });
      spectator.detectChanges();
      setTimeout(() => {
        const searchFollowedUsersRequest = twitterWidgetService.expectOne(
          `${environment.backend_url}/twitterWidget/followed?search=test`,
          HttpMethod.GET
        );

        const searchedUser = { id: 2, userHandle: 'testHandle' };
        searchFollowedUsersRequest.flush({
          content: [searchedUser],
          totalPages: 1,
          totalElements: 1,
          last: true,
          size: 1,
          number: 0
        } as IPage<IFollowedUser>);

        expect(spectator.component.followedUsers).toEqual([searchedUser]);
        done();
      }, 500);
    });

    it('Should select a followed user and delete it', () => {
      spectator.component.followedUsers = [followedUserData];
      expect(spectator.component.isFormValid()).toEqual(false);
      expect(spectator.component.getWidgetData()).toEqual(undefined);
      spectator.component.selectUserHandle(followedUserData.userHandle);
      expect(spectator.component.selectedTwitterHandle).toEqual(followedUserData.userHandle);
      expect(spectator.component.isFormValid()).toEqual(true);
      expect(spectator.component.getWidgetData()).toEqual({
        twitterHandle: followedUserData.userHandle
      });
      spectator.component.deleteFollowedUser(followedUserData.id);

      const removeFollowedUserRequest = twitterWidgetService.expectOne(
        `${environment.backend_url}/twitterWidget/deleteFollowedUser?followedUserId=${followedUserData.id}`,
        HttpMethod.DELETE
      );

      removeFollowedUserRequest.flush(null);
      expect(spectator.component.followedUsers).toEqual([]);
    });
  });

  describe('Error tests', () => {
    let errorHandlerServiceSpy: ErrorHandlerService;
    const createComponent = createComponentFactory({
      component: TwitterWidgetComponent,
      imports: [MatSnackBarModule],
      providers: [TwitterWidgetService, ErrorHandlerService, ThemeService],
      schemas: []
    });
    const createHttp = createHttpFactory(TwitterWidgetService);

    beforeEach(() => {
      spectator = createComponent();
      twitterWidgetService = createHttp();
      const errorHandlerService = spectator.inject(ErrorHandlerService);
      errorHandlerServiceSpy = jest.spyOn(
        errorHandlerService,
        'handleError'
      ) as unknown as ErrorHandlerService;
    });

    it('Should display error message while getting a followed user', (done) => {
      spectator.component.searchFormControl.setValue('errorFromServer', {
        onlySelf: false,
        emitEvent: true
      });
      spectator.detectChanges();
      setTimeout(() => {
        const searchFollowedUsersRequest = twitterWidgetService.expectOne(
          `${environment.backend_url}/twitterWidget/followed?search=errorFromServer`,
          HttpMethod.GET
        );

        searchFollowedUsersRequest.flush(null, { status: 500, statusText: 'Error' });

        expect(errorHandlerServiceSpy).toHaveBeenCalledTimes(1);
        expect(spectator.component.followedUsers).toEqual([]);
        done();
      }, 500);
    });

    it('should fail while adding a followed user', () => {
      expect(spectator.component.followedUsers).toEqual([]);
      spectator.component.searchFormControl.setValue('Nono');
      spectator.component.addFollowedUser();

      const addFollowedUserRequest = twitterWidgetService.expectOne(
        `${environment.backend_url}/twitterWidget/addFollowedUser`,
        HttpMethod.POST
      );

      addFollowedUserRequest.flush(null, { status: 500, statusText: 'Error' });
      expect(errorHandlerServiceSpy).toHaveBeenCalledTimes(1);
      expect(spectator.component.followedUsers).toEqual([]);
    });

    it('Should fail to select a followed user and delete it', () => {
      const followedUserData = { id: 1, userHandle: 'Nono' } as IFollowedUser;
      spectator.component.followedUsers = [followedUserData];

      spectator.component.selectUserHandle(followedUserData.userHandle);
      expect(spectator.component.selectedTwitterHandle).toEqual(followedUserData.userHandle);

      spectator.component.deleteFollowedUser(followedUserData.id);

      const removeFollowedUserRequest = twitterWidgetService.expectOne(
        `${environment.backend_url}/twitterWidget/deleteFollowedUser?followedUserId=${followedUserData.id}`,
        HttpMethod.DELETE
      );

      removeFollowedUserRequest.flush(null, { status: 500, statusText: 'Error' });
      expect(errorHandlerServiceSpy).toHaveBeenCalledTimes(1);
      expect(spectator.component.followedUsers).toEqual([followedUserData]);
    });
  });
});

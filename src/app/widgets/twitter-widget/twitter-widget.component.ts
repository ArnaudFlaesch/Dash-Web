import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { ErrorHandlerService } from '../../services/error.handler.service';
import { IFollowedUser } from './ITwitter';
import { TwitterWidgetService } from './twitter.widget.service';

@Component({
  selector: 'app-twitter-widget',
  templateUrl: './twitter-widget.component.html',
  styleUrls: ['./twitter-widget.component.scss']
})
export class TwitterWidgetComponent implements OnInit {
  @ViewChild('twitterTimeline', { static: false }) timeline: ElementRef | undefined;

  public selectedTwitterHandle: string | undefined;
  public followedUsers: IFollowedUser[] = [];

  public isWidgetLoaded = true;

  public searchFormControl = new FormControl('');

  private ERROR_GETTING_FOLLOWED_USERS =
    'Erreur lors de la récupération de la liste des utilisateurs suivis sur Twitter.';

  private ERROR_ADDING_FOLLOWED_USER = "Erreur lors de l'ajout de l'utilisateur.";

  private ERROR_REMOVING_FOLLOWED_USER = "Erreur lors de la suppression de l'utilisateur.";

  constructor(
    private cdRef: ChangeDetectorRef,
    private twitterWidgetService: TwitterWidgetService,
    private errorHandlerService: ErrorHandlerService
  ) {}

  public ngOnInit(): void {
    this.searchFormControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchValue) => {
        this.twitterWidgetService.getFollowedUsers(searchValue || undefined).subscribe({
          next: (followedUsersResponse) =>
            (this.followedUsers = followedUsersResponse.slice(0, 10)),
          error: (error) =>
            this.errorHandlerService.handleError(error.message, this.ERROR_GETTING_FOLLOWED_USERS)
        });
      });
  }

  ngAfterViewInit(): void {
    this.initTwitterWidget();
  }

  public refreshWidget(): void {
    this.cdRef.detectChanges();
    if (this.timeline) {
      const iframe = this.timeline.nativeElement.getElementsByTagName('iframe')[0];
      if (iframe) {
        const src = iframe.src;
        iframe.src = src;
      }
    }
  }

  public selectUserHandle(userHandle: string): void {
    this.selectedTwitterHandle = userHandle;
  }

  public addFollowedUser(): void {
    if (this.searchFormControl.value && this.searchFormControl.value.length) {
      this.twitterWidgetService.addFollowedUser(this.searchFormControl.value).subscribe({
        next: (addedFollowedUser: IFollowedUser) =>
          (this.followedUsers = [...this.followedUsers, addedFollowedUser]),
        error: (error) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_ADDING_FOLLOWED_USER)
      });
    }
  }

  public deleteFollowedUser(followedUserId: number): void {
    this.twitterWidgetService.deleteFollowedUser(followedUserId).subscribe({
      next: () =>
        (this.followedUsers = this.followedUsers.filter(
          (followedUser) => followedUser.id !== followedUserId
        )),
      error: (error) =>
        this.errorHandlerService.handleError(error.message, this.ERROR_REMOVING_FOLLOWED_USER)
    });
  }

  public getWidgetData():
    | {
        twitterHandle: string;
      }
    | undefined {
    return this.selectedTwitterHandle ? { twitterHandle: this.selectedTwitterHandle } : undefined;
  }

  public isFormValid(): boolean {
    return !!this.selectedTwitterHandle && this.selectedTwitterHandle?.length > 0;
  }

  /* eslint-disable */
  private initTwitterWidget(): void {
    (<any>window).twttr = (function (d, s, id) {
      const fjs: any = d.getElementsByTagName(s)[0],
        t = (<any>window).twttr || {};
      if (d.getElementById(id)) return t;
      const js: any = d.createElement(s);
      js.id = id;
      js.src = 'https://platform.twitter.com/widgets.js';
      fjs?.parentNode?.insertBefore(js, fjs);

      t._e = [];
      t.ready = function (f: any) {
        t._e.push(f);
      };

      return t;
    })(document, 'script', 'twitter-wjs');

    if ((<any>window).twttr.ready()) {
      (<any>window).twttr.widgets.load();
    }
  }
  /* eslint-enable */
}

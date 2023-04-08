import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { ErrorHandlerService } from '../../services/error.handler.service';
import { IFollowedUser } from './ITwitter';
import { TwitterWidgetService } from './twitter.widget.service';
import { ThemeService } from '../../services/theme.service/theme.service';
import { PageEvent } from '@angular/material/paginator';

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
  public twitterTimelineUrl = '';

  public followedUsersCount = 0;
  public pageSize = 10;
  public pageSizeOptions = [this.pageSize];
  public pageNumber = 0;

  private ERROR_GETTING_FOLLOWED_USERS =
    'Erreur lors de la récupération de la liste des utilisateurs suivis sur Twitter.';
  private ERROR_ADDING_FOLLOWED_USER = "Erreur lors de l'ajout de l'utilisateur.";
  private ERROR_REMOVING_FOLLOWED_USER = "Erreur lors de la suppression de l'utilisateur.";

  constructor(
    private cdRef: ChangeDetectorRef,
    private twitterWidgetService: TwitterWidgetService,
    private themeService: ThemeService,
    private errorHandlerService: ErrorHandlerService
  ) {}

  public ngOnInit(): void {
    if (this.selectedTwitterHandle) {
      this.twitterTimelineUrl = this.createTimelineUrl();
    }
    this.searchFormControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchValue) => {
        this.pageNumber = 0;
        this.fetchFollowedUsers(this.pageNumber, searchValue || undefined);
      });
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
    this.twitterTimelineUrl = this.createTimelineUrl();
  }

  public addFollowedUser(): void {
    if (this.searchFormControl.value && this.searchFormControl.value.length) {
      this.twitterWidgetService.addFollowedUser(this.searchFormControl.value).subscribe({
        next: (addedFollowedUser: IFollowedUser) =>
          (this.followedUsers = [...this.followedUsers, addedFollowedUser]),
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_ADDING_FOLLOWED_USER)
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
        this.errorHandlerService.handleError(error, this.ERROR_REMOVING_FOLLOWED_USER)
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

  public getPreferredTheme(): string {
    return this.themeService.isPreferredThemeDarkMode() ? 'dark' : 'light';
  }

  public onPageChanged(event: PageEvent): void {
    this.pageNumber = event.pageIndex;
    this.fetchFollowedUsers(this.pageNumber, this.searchFormControl.value || undefined);
  }

  private fetchFollowedUsers(pageNumber: number, searchValue?: string): void {
    this.twitterWidgetService.getFollowedUsers(pageNumber, searchValue || undefined).subscribe({
      next: (followedUsersResponse) => {
        this.followedUsers = followedUsersResponse.content;
        this.pageNumber = followedUsersResponse.number;
        this.followedUsersCount = followedUsersResponse.totalElements;
      },
      error: (error) =>
        this.errorHandlerService.handleError(error, this.ERROR_GETTING_FOLLOWED_USERS)
    });
  }

  private createTimelineUrl(): string {
    return `https://twitter.com/${this.selectedTwitterHandle}?ref_src=twsrc%5Etfw`;
  }
}

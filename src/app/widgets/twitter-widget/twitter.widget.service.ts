import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import authorizationBearer from '../../services/authorizationBearer/authorizationBearer';
import { environment } from '../../../environments/environment';
import { IFollowedUser } from './ITwitter';
import { IPage } from 'src/app/model/IPage';

@Injectable()
export class TwitterWidgetService {
  constructor(private http: HttpClient) {}

  public getFollowedUsers(pageNumber: number, search?: string): Observable<IPage<IFollowedUser>> {
    const params: { search?: string; pageNumber?: number } = {};
    if (search) {
      params.search = search;
    }
    if (pageNumber) {
      params.pageNumber = pageNumber;
    }
    return this.http.get<IPage<IFollowedUser>>(
      `${environment.backend_url}/twitterWidget/followed`,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        },
        params: params
      }
    );
  }

  public addFollowedUser(followedUserHandle: string): Observable<IFollowedUser> {
    return this.http.post<IFollowedUser>(
      `${environment.backend_url}/twitterWidget/addFollowedUser`,
      { userHandle: followedUserHandle },
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }

  public deleteFollowedUser(followedUserId: number): Observable<void> {
    return this.http.delete<void>(
      `${environment.backend_url}/twitterWidget/deleteFollowedUser?followedUserId=${followedUserId}`,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }
}

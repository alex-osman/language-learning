import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RoleplayTurnRequest, RoleplayTurnResponse } from '../components/lesson-tutor/content/lesson-tutor-content.types';

@Injectable({
  providedIn: 'root',
})
export class LessonRoleplayService {
  constructor(private http: HttpClient) {}

  sendTurn(request: RoleplayTurnRequest): Observable<RoleplayTurnResponse> {
    return this.http.post<RoleplayTurnResponse>('/api/ai/lesson-roleplay', request);
  }
}

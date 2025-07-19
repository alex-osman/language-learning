import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface LoginRequest {
  email: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface User {
  userId: number;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = '/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  login(loginRequest: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginRequest).pipe(
      tap(response => {
        this.storeToken(response.access_token);
        this.loadUserProfile();
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private storeToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  private loadStoredUser(): void {
    const token = this.getToken();
    if (token) {
      this.loadUserProfile();
    }
  }

  private loadUserProfile(): void {
    this.getProfile().subscribe({
      next: user => {
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      },
      error: () => {
        this.logout();
      },
    });
  }
}

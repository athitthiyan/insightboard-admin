import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

const ACCESS_TOKEN_KEY = 'insightboard_access_token';
const REFRESH_TOKEN_KEY = 'insightboard_refresh_token';
const AUTH_USER_KEY = 'insightboard_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private accessTokenState = signal<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY));
  private refreshTokenState = signal<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY));
  private userState = signal<AuthUser | null>(this.readStoredUser());

  readonly accessToken = computed(() => this.accessTokenState());
  readonly refreshToken = computed(() => this.refreshTokenState());
  readonly user = computed(() => this.userState());
  readonly isAuthenticated = computed(() => !!this.accessTokenState() && !!this.userState());
  readonly isAdmin = computed(() => this.userState()?.is_admin === true);

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => this.applyAuth(response))
    );
  }

  refreshToken$(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {
      refresh_token: this.refreshTokenState(),
    }).pipe(
      tap(response => this.applyAuth(response))
    );
  }

  logout(redirect = true) {
    // Revoke refresh token server-side (fire-and-forget)
    const rt = this.refreshTokenState();
    if (rt) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refresh_token: rt }).subscribe();
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    this.accessTokenState.set(null);
    this.refreshTokenState.set(null);
    this.userState.set(null);
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  restoreSession(): Observable<AuthUser> | null {
    if (!this.accessTokenState()) {
      return null;
    }
    return this.http.get<AuthUser>(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => {
        this.userState.set(user);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      })
    );
  }

  private applyAuth(response: AuthResponse) {
    this.accessTokenState.set(response.access_token);
    this.refreshTokenState.set(response.refresh_token);
    this.userState.set(response.user);
    localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      localStorage.removeItem(AUTH_USER_KEY);
      return null;
    }
  }
}

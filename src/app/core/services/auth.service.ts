import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
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

// Access token in memory only; refresh token in HttpOnly cookie (set by backend)
const AUTH_USER_KEY = 'stayvora_admin_auth_user';

/**
 * AdminAuthService handles authentication for the InsightBoard admin portal.
 *
 * Manages access tokens (in-memory) and refresh tokens (HttpOnly cookies).
 * Provides user session state via signals and computed properties.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Access token lives in memory only (not persisted)
  private accessTokenState = signal<string | null>(null);
  private userState = signal<AuthUser | null>(this.readStoredUser());

  readonly accessToken = computed(() => this.accessTokenState());
  readonly user = computed(() => this.userState());
  readonly isAuthenticated = computed(() => !!this.accessTokenState() && !!this.userState());
  readonly isAdmin = computed(() => this.userState()?.is_admin === true);

  /**
   * Authenticates user with email and password.
   * @param email User email
   * @param password User password
   * @returns Observable of AuthResponse containing access token and user data
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password }, { withCredentials: true }).pipe(
      tap(response => this.applyAuth(response))
    );
  }

  /**
   * Refreshes the access token using the refresh token from HttpOnly cookie.
   * @returns Observable of AuthResponse with new access token
   */
  refreshToken$(): Observable<AuthResponse> {
    // Refresh token is sent automatically via HttpOnly cookie
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
      tap(response => this.applyAuth(response))
    );
  }

  /**
   * Logs out the current user and clears authentication state.
   * @param redirect If true, navigates to login page after logout
   */
  logout(redirect = true) {
    // Revoke refresh token server-side (cookie sent automatically)
    this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe();
    localStorage.removeItem(AUTH_USER_KEY);
    this.accessTokenState.set(null);
    this.userState.set(null);
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Restore session on app init by calling /auth/refresh.
   * HttpOnly cookie is sent automatically. Returns true if restored.
   */
  restoreSession(): Observable<boolean> {
    if (!this.readStoredUser()) {
      return of(false);
    }
    return this.refreshToken$().pipe(
      map(() => true),
      catchError(() => {
        localStorage.removeItem(AUTH_USER_KEY);
        this.accessTokenState.set(null);
        this.userState.set(null);
        return of(false);
      }),
    );
  }

  /**
   * Applies authentication response and updates internal state.
   * Stores user profile (non-sensitive) in localStorage.
   * @private
   * @param response Authentication response from server
   */
  private applyAuth(response: AuthResponse) {
    this.accessTokenState.set(response.access_token);
    this.userState.set(response.user);
    // Only cache user profile (non-sensitive) in localStorage
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
  }

  /**
   * Reads stored user profile from localStorage.
   * @private
   * @returns Cached user profile or null if not found/invalid
   */
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

import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { AuthResponse, AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  const authResponse: AuthResponse = {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    token_type: 'bearer',
    user: {
      id: 1,
      email: 'admin@example.com',
      full_name: 'Admin User',
      is_admin: true,
      is_active: true,
    },
  };

  const configureTestingModule = () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  };

  beforeEach(() => {
    localStorage.clear();
    configureTestingModule();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('stores tokens and user on login', () => {
    service.login('admin@example.com', 'AdminPass123').subscribe(response => {
      expect(response.user.email).toBe('admin@example.com');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush(authResponse);

    expect(service.accessToken()).toBe('access-token');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(true);
    expect(localStorage.getItem('stayvora_admin_auth_user')).toBe(JSON.stringify(authResponse.user));
  });

  it('clears auth state, calls logout endpoint, and redirects on logout by default', async () => {
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    service.login('admin@example.com', 'AdminPass123').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(authResponse);

    service.logout();

    // Flush the fire-and-forget logout POST
    const logoutReq = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(logoutReq.request.method).toBe('POST');
    expect(logoutReq.request.body).toEqual({});
    expect(logoutReq.request.withCredentials).toBe(true);
    logoutReq.flush({ message: 'Logged out successfully' });

    expect(service.accessToken()).toBeNull();
    expect(service.user()).toBeNull();
    expect(localStorage.getItem('stayvora_admin_auth_user')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('refreshes tokens and keeps the user in sync', () => {
    service.login('admin@example.com', 'AdminPass123').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(authResponse);

    service.refreshToken$().subscribe(response => {
      expect(response.access_token).toBe('fresh-access');
    });

    const refreshReq = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(refreshReq.request.method).toBe('POST');
    expect(refreshReq.request.body).toEqual({});
    expect(refreshReq.request.withCredentials).toBe(true);
    refreshReq.flush({
      ...authResponse,
      access_token: 'fresh-access',
      refresh_token: 'fresh-refresh',
    });

    expect(service.accessToken()).toBe('fresh-access');
    expect(localStorage.getItem('stayvora_admin_auth_user')).toBe(JSON.stringify(authResponse.user));
  });

  it('skips navigation when logout is requested without redirect and there is no refresh token', async () => {
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    service.logout(false);
    httpMock.expectOne(`${environment.apiUrl}/auth/logout`).flush({ message: 'Logged out successfully' });

    expect(service.accessToken()).toBeNull();
    expect(service.user()).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('restores the current user when a cached user exists', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('stayvora_admin_auth_user', JSON.stringify(authResponse.user));

    configureTestingModule();
    service.restoreSession()?.subscribe(restored => {
      expect(restored).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(req.request.method).toBe('POST');
    req.flush(authResponse);

    expect(service.user()?.email).toBe('admin@example.com');
  });

  it('returns null from restoreSession when no token exists', () => {
    service.restoreSession().subscribe(restored => {
      expect(restored).toBe(false);
    });
  });

  it('restores the user in storage after restoreSession succeeds', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('stayvora_admin_auth_user', JSON.stringify(authResponse.user));

    configureTestingModule();
    service.restoreSession().subscribe();

    httpMock.expectOne(`${environment.apiUrl}/auth/refresh`).flush(authResponse);

    expect(localStorage.getItem('stayvora_admin_auth_user')).toBe(JSON.stringify(authResponse.user));
  });

  it('drops malformed stored user payloads', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('stayvora_admin_auth_user', '{bad json');

    configureTestingModule();

    expect(service.user()).toBeNull();
    expect(localStorage.getItem('stayvora_admin_auth_user')).toBeNull();
  });
});

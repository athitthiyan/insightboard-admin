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
    req.flush(authResponse);

    expect(service.accessToken()).toBe('access-token');
    expect(service.refreshToken()).toBe('refresh-token');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(true);
    expect(localStorage.getItem('insightboard_access_token')).toBe('access-token');
  });

  it('clears auth state, calls logout endpoint, and redirects on logout by default', async () => {
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    service.login('admin@example.com', 'AdminPass123').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(authResponse);

    service.logout();

    // Flush the fire-and-forget logout POST
    const logoutReq = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(logoutReq.request.method).toBe('POST');
    expect(logoutReq.request.body).toEqual({ refresh_token: 'refresh-token' });
    logoutReq.flush({ message: 'Logged out successfully' });

    expect(service.accessToken()).toBeNull();
    expect(service.user()).toBeNull();
    expect(localStorage.getItem('insightboard_access_token')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('restores the current user when a token exists', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('insightboard_access_token', 'stored-access');
    localStorage.setItem('insightboard_refresh_token', 'stored-refresh');
    localStorage.setItem('insightboard_auth_user', JSON.stringify(authResponse.user));

    configureTestingModule();
    service.restoreSession()?.subscribe(user => {
      expect(user.full_name).toBe('Admin User');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush(authResponse.user);

    expect(service.user()?.email).toBe('admin@example.com');
  });

  it('returns null from restoreSession when no token exists', () => {
    expect(service.restoreSession()).toBeNull();
  });

  it('drops malformed stored user payloads', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('insightboard_auth_user', '{bad json');

    configureTestingModule();

    expect(service.user()).toBeNull();
    expect(localStorage.getItem('insightboard_auth_user')).toBeNull();
  });
});

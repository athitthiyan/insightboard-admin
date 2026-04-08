import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const router = { navigate: jest.fn() };
  const auth = {
    accessToken: jest.fn(),
    refreshToken: jest.fn(),
    refreshToken$: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(() => {
    router.navigate.mockReset();
    auth.accessToken.mockReset();
    auth.refreshToken.mockReset();
    auth.refreshToken$.mockReset();
    auth.logout.mockReset();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds the bearer token when available', () => {
    auth.accessToken.mockReturnValue('access-token');

    http.get('/secure').subscribe();

    const req = httpMock.expectOne('/secure');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-token');
    req.flush({});
  });

  it('attempts refresh on 401 and retries original request on success', () => {
    auth.accessToken.mockReturnValue('old-token');
    auth.refreshToken.mockReturnValue('refresh-token');
    auth.refreshToken$.mockReturnValue(of({ access_token: 'new-token' }));

    http.get('/secure').subscribe();

    const req = httpMock.expectOne('/secure');
    req.flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    // After refresh, the interceptor retries the original request
    const retry = httpMock.expectOne('/secure');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush({ ok: true });

    expect(auth.refreshToken$).toHaveBeenCalled();
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('logs out when refresh fails', () => {
    auth.accessToken.mockReturnValue('old-token');
    auth.refreshToken.mockReturnValue('refresh-token');
    auth.refreshToken$.mockReturnValue(throwError(() => new Error('refresh failed')));

    http.get('/secure').subscribe({ error: () => undefined });

    const req = httpMock.expectOne('/secure');
    req.flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).toHaveBeenCalledWith(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not attempt refresh for login endpoint failures', () => {
    auth.accessToken.mockReturnValue(null);

    http.post('/auth/login', {}).subscribe({ error: () => undefined });

    const req = httpMock.expectOne('/auth/login');
    req.flush({ detail: 'Invalid' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.refreshToken$).not.toHaveBeenCalled();
    expect(auth.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('logs out immediately for unauthorized requests without a refresh token', () => {
    auth.accessToken.mockReturnValue('token');
    auth.refreshToken.mockReturnValue(null);

    http.get('/secure').subscribe({ error: () => undefined });

    const req = httpMock.expectOne('/secure');
    req.flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.refreshToken$).not.toHaveBeenCalled();
    expect(auth.logout).toHaveBeenCalledWith(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});

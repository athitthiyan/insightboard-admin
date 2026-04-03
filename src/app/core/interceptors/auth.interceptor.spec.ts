import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const router = { navigate: jest.fn() };
  const auth = {
    accessToken: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(() => {
    router.navigate.mockReset();
    auth.accessToken.mockReset();
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

  it('logs out and redirects on unauthorized non-login calls', () => {
    auth.accessToken.mockReturnValue('access-token');

    http.get('/secure').subscribe({
      error: () => undefined,
    });

    const req = httpMock.expectOne('/secure');
    req.flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).toHaveBeenCalledWith(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not redirect for login endpoint failures', () => {
    auth.accessToken.mockReturnValue(null);

    http.post('/auth/login', {}).subscribe({
      error: () => undefined,
    });

    const req = httpMock.expectOne('/auth/login');
    req.flush({ detail: 'Invalid' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});

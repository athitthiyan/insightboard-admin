import { of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

describe('LoginComponent', () => {
  let router: Router;
  const authService = {
    login: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    authService.login.mockReset();
    authService.logout.mockReset();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('shows a validation message when fields are empty', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.login();

    expect(component.error()).toBe('Email and password are required.');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('navigates to dashboard for admin users', () => {
    authService.login.mockReturnValue(
      of({
        access_token: 'token',
        refresh_token: 'refresh',
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'admin@example.com',
          full_name: 'Admin User',
          is_admin: true,
          is_active: true,
        },
      })
    );

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.email = 'admin@example.com';
    component.password = 'AdminPass123';

    component.login();

    expect(authService.login).toHaveBeenCalledWith('admin@example.com', 'AdminPass123');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
    expect(component.loading()).toBe(false);
  });

  it('rejects non-admin users after login', () => {
    authService.login.mockReturnValue(
      of({
        access_token: 'token',
        refresh_token: 'refresh',
        token_type: 'bearer',
        user: {
          id: 2,
          email: 'user@example.com',
          full_name: 'Normal User',
          is_admin: false,
          is_active: true,
        },
      })
    );

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.email = 'user@example.com';
    component.password = 'UserPass123';

    component.login();

    expect(authService.logout).toHaveBeenCalledWith(false);
    expect(component.error()).toBe('This account does not have admin access.');
  });

  it('shows backend error detail on failed login', () => {
    authService.login.mockReturnValue(
      throwError(() => ({
        error: { detail: 'Invalid email or password' },
      }))
    );

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.email = 'admin@example.com';
    component.password = 'bad-password';

    component.login();

    expect(component.error()).toBe('Invalid email or password');
    expect(component.loading()).toBe(false);
  });

  it('shows the generic error when the backend provides no detail', () => {
    authService.login.mockReturnValue(
      throwError(() => ({
        error: {},
      }))
    );

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.email = 'admin@example.com';
    component.password = 'bad-password';

    component.login();

    expect(component.error()).toBe('Unable to sign in right now.');
    expect(component.loading()).toBe(false);
  });
});

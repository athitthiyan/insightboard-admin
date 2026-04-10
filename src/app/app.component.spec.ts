import { of, Subject, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router, provideRouter } from '@angular/router';

import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';

describe('AppComponent', () => {
  const events$ = new Subject<unknown>();
  const authService = {
    isAuthenticated: jest.fn(),
    restoreSession: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    authService.isAuthenticated.mockReset();
    authService.restoreSession.mockReset();
    authService.logout.mockReset();
    events$.observers.length = 0;

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    Object.defineProperty(router, 'events', { value: events$.asObservable() });
    Object.defineProperty(router, 'url', { value: '/login', writable: true });
  });

  it('hides the admin shell on the login route', () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.restoreSession.mockReturnValue(null);

    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;

    expect(component.showAdminShell()).toBe(false);
  });

  it('shows the admin shell after navigation when authenticated', () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.restoreSession.mockReturnValue(null);

    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router) as Router & { url: string };

    router.url = '/';
    events$.next(new NavigationEnd(1, '/', '/'));

    expect(component.showAdminShell()).toBe(true);
  });

  it('sets isAuthReady after restoreSession completes successfully', () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.restoreSession.mockReturnValue(of(true));

    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;

    expect(component.isAuthReady()).toBe(true);
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('logs out quietly when restoring the session fails', () => {
    authService.isAuthenticated.mockReturnValue(false);
    authService.restoreSession.mockReturnValue(
      throwError(() => new Error('restore failed'))
    );

    TestBed.createComponent(AppComponent);

    expect(authService.logout).toHaveBeenCalledWith(false);
  });

  it('toggles and closes the mobile sidebar state', () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.restoreSession.mockReturnValue(null);

    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;

    expect(component.sidebarOpen()).toBe(false);
    component.toggleSidebar();
    expect(component.sidebarOpen()).toBe(true);
    component.closeSidebar();
    expect(component.sidebarOpen()).toBe(false);
  });
});

import { TestBed } from '@angular/core/testing';

import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/services/auth.service';

describe('HeaderComponent', () => {
  const authService = {
    user: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    authService.user.mockReset();
    authService.logout.mockReset();

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('derives display name, role, and initials from the current user', () => {
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;

    expect(component.displayName()).toBe('Admin Person');
    expect(component.roleLabel()).toBe('Administrator');
    expect(component.initials()).toBe('AP');
  });

  it('falls back to default labels when no user is available', () => {
    authService.user.mockReturnValue(null);

    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;

    expect(component.displayName()).toBe('Admin');
    expect(component.roleLabel()).toBe('Team');
    expect(component.initials()).toBe('A');
  });

  it('derives the afternoon greeting from the current hour', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-05T14:00:00'));
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;

    expect(component.timeOfDay()).toBe('afternoon');
  });

  it('derives the morning greeting from the current hour', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-05T09:00:00'));
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;

    expect(component.timeOfDay()).toBe('morning');
  });

  it('derives the evening greeting from the current hour', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-05T19:00:00'));
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;

    expect(component.timeOfDay()).toBe('evening');
  });

  it('logs out when the logout action is triggered', () => {
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;

    component.logout();

    expect(authService.logout).toHaveBeenCalled();
  });

  it('emits a menu toggle event for mobile navigation', () => {
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;
    const emitSpy = jest.spyOn(component.menuToggle, 'emit');

    component.menuToggle.emit();

    expect(emitSpy).toHaveBeenCalled();
  });
});

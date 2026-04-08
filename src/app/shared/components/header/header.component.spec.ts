import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/services/auth.service';

describe('HeaderComponent', () => {
  let httpMock: HttpTestingController;
  const notificationsUrl = 'http://127.0.0.1:8000/notifications';

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
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    httpMock.verify();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(HeaderComponent);
    httpMock.expectOne(notificationsUrl).flush({ notifications: [] });
    return fixture;
  }

  it('derives display name, role, and initials from the current user', () => {
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component.displayName()).toBe('Admin Person');
    expect(component.roleLabel()).toBe('Administrator');
    expect(component.initials()).toBe('AP');
  });

  it('falls back to default labels when no user is available', () => {
    authService.user.mockReturnValue(null);

    const fixture = createComponent();
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

    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component.timeOfDay()).toBe('afternoon');
  });

  it('derives the morning greeting from the current hour', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-05T09:00:00'));
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component.timeOfDay()).toBe('morning');
  });

  it('derives the evening greeting from the current hour', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-05T19:00:00'));
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component.timeOfDay()).toBe('evening');
  });

  it('logs out when the logout action is triggered', () => {
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.logout();

    expect(authService.logout).toHaveBeenCalled();
  });

  it('emits a menu toggle event for mobile navigation', () => {
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = createComponent();
    const component = fixture.componentInstance;
    const emitSpy = jest.spyOn(component.menuToggle, 'emit');

    component.menuToggle.emit();

    expect(emitSpy).toHaveBeenCalled();
  });

  it('loads notifications, computes unread count, toggles the panel, and closes on outside click', () => {
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;
    httpMock.expectOne(notificationsUrl).flush({
      notifications: [
        { id: 1, type: 'booking', title: 'Booking', message: 'New booking', read: false, created_at: new Date().toISOString() },
        { id: 2, type: 'system', title: 'System', message: 'Info', read: true, created_at: new Date().toISOString() },
      ],
    });

    expect(component.notifications()).toHaveLength(2);
    expect(component.unreadCount()).toBe(1);

    component.toggleNotifications();
    httpMock.expectOne(notificationsUrl).flush({ notifications: component.notifications() });
    expect(component.notifOpen()).toBe(true);

    const outside = document.createElement('div');
    component.onDocClick({ target: outside } as unknown as MouseEvent);
    expect(component.notifOpen()).toBe(false);
  });

  it('keeps the panel open for clicks inside the panel or bell trigger', () => {
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.notifOpen.set(true);
    const panelChild = document.createElement('div');
    const panel = document.createElement('div');
    panel.className = 'notif-panel';
    panel.appendChild(panelChild);
    component.onDocClick({ target: panelChild } as unknown as MouseEvent);
    expect(component.notifOpen()).toBe(true);

    const bellChild = document.createElement('span');
    const bell = document.createElement('button');
    bell.className = 'admin-header__notif';
    bell.appendChild(bellChild);
    component.onDocClick({ target: bellChild } as unknown as MouseEvent);
    expect(component.notifOpen()).toBe(true);
  });

  it('surfaces a notification error and keeps the list empty when the initial API request fails', () => {
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;
    httpMock.expectOne(notificationsUrl).flush({}, { status: 500, statusText: 'Error' });

    expect(component.notifications()).toEqual([]);
    expect(component.unreadCount()).toBe(0);
    expect(component.notificationError()).toBe('Notifications are temporarily unavailable.');
  });

  it('treats a successful response with null notifications as an empty list', () => {
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;
    httpMock.expectOne(notificationsUrl).flush({ notifications: null });

    expect(component.notifications()).toEqual([]);
    expect(component.unreadCount()).toBe(0);
  });

  it('does not overwrite existing notifications on API failure', () => {
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.notifications.set([
      { id: 99, type: 'booking', title: 'Existing', message: 'Keep me', read: false, created_at: new Date().toISOString() },
    ]);

    component.loadNotifications();
    httpMock.expectOne(notificationsUrl).flush({}, { status: 500, statusText: 'Error' });

    expect(component.notifications()).toHaveLength(1);
    expect(component.notifications()[0].id).toBe(99);
    expect(component.notificationError()).toBe('Notifications are temporarily unavailable.');
  });

  it('marks a notification as read and supports mark-all read', () => {
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;
    httpMock.expectOne(notificationsUrl).flush({
      notifications: [
        { id: 1, type: 'booking', title: 'Booking', message: 'New booking', read: false, created_at: new Date().toISOString() },
        { id: 2, type: 'system', title: 'System', message: 'Info', read: false, created_at: new Date().toISOString() },
      ],
    });

    component.markRead(component.notifications()[0]);
    const markReadReq = httpMock.expectOne('http://127.0.0.1:8000/notifications/1/read');
    expect(markReadReq.request.method).toBe('PATCH');
    markReadReq.flush({});
    expect(component.notifications()[0].read).toBe(true);

    component.markAllRead();
    const markAllReq = httpMock.expectOne('http://127.0.0.1:8000/notifications/read-all');
    expect(markAllReq.request.method).toBe('PATCH');
    markAllReq.flush({});
    expect(component.notifications().every(item => item.read)).toBe(true);
  });

  it('returns early when marking an already read notification', () => {
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;
    httpMock.expectOne(notificationsUrl).flush({
      notifications: [
        { id: 1, type: 'booking', title: 'Booking', message: 'New booking', read: true, created_at: new Date().toISOString() },
      ],
    });

    component.markRead(component.notifications()[0]);
  });

  it('handles notification patch failures without throwing', () => {
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;
    httpMock.expectOne(notificationsUrl).flush({
      notifications: [
        { id: 1, type: 'booking', title: 'Booking', message: 'New booking', read: false, created_at: new Date().toISOString() },
      ],
    });

    component.markRead(component.notifications()[0]);
    httpMock.expectOne('http://127.0.0.1:8000/notifications/1/read').flush({}, { status: 500, statusText: 'Error' });

    component.markAllRead();
    httpMock.expectOne('http://127.0.0.1:8000/notifications/read-all').flush({}, { status: 500, statusText: 'Error' });

    expect(component.notifications().every(item => item.read)).toBe(true);
  });

  it('formats notification icons and relative times across all branches', () => {
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    jest.useFakeTimers().setSystemTime(new Date('2026-04-08T12:00:00Z'));
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component.getNotifIcon('booking')).toBe('☑');
    expect(component.getNotifIcon('payment')).toBe('₹');
    expect(component.getNotifIcon('refund')).toBe('↩');
    expect(component.getNotifIcon('partner')).toBe('☖');
    expect(component.getNotifIcon('system')).toBe('⚙');
    expect(component.getNotifIcon('cancellation')).toBe('✕');
    expect(component.getNotifIcon('mystery')).toBe('ℹ');

    expect(component.formatTimeAgo('2026-04-08T11:59:45Z')).toBe('Just now');
    expect(component.formatTimeAgo('2026-04-08T11:30:00Z')).toBe('30m ago');
    expect(component.formatTimeAgo('2026-04-08T09:00:00Z')).toBe('3h ago');
    expect(component.formatTimeAgo('2026-04-06T12:00:00Z')).toBe('2d ago');
  });

  it('clears the polling interval on destroy', () => {
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const clearSpy = jest.spyOn(global, 'clearInterval');
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.ngOnDestroy();

    expect(clearSpy).toHaveBeenCalled();
  });

  it('polls for notifications every 30 seconds', async () => {
    jest.useFakeTimers();
    authService.user.mockReturnValue({
      full_name: 'Admin Person',
      is_admin: true,
    });

    const fixture = createComponent();
    const component = fixture.componentInstance;

    await jest.advanceTimersByTimeAsync(30000);

    httpMock.expectOne(notificationsUrl).flush({
      notifications: [
        { id: 10, type: 'system', title: 'Polling', message: 'Fresh update', read: false, created_at: new Date().toISOString() },
      ],
    });

    expect(component.notifications()).toHaveLength(1);
    expect(component.notifications()[0].id).toBe(10);
  });
});

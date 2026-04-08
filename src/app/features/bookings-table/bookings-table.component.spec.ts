import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject } from 'rxjs';

import { BookingsTableComponent } from './bookings-table.component';
import { environment } from '../../../environments/environment';
import { PlatformSyncService } from '../../core/services/platform-sync.service';

const sampleBookings = [
  {
    id: 1, booking_ref: 'BK001', user_name: 'Alice Smith', email: 'alice@example.com',
    status: 'confirmed', payment_status: 'paid', room: { hotel_name: 'Grand Hotel', room_type: 'suite' },
    check_in: '2027-03-10', check_out: '2027-03-12', nights: 2, total_amount: 400, guests: 2,
  },
  {
    id: 2, booking_ref: 'BK002', user_name: 'Bob Jones', email: 'bob@example.com',
    status: 'pending', payment_status: 'pending', room: { hotel_name: 'Sea View', room_type: 'deluxe' },
    check_in: '2027-03-15', check_out: '2027-03-16', nights: 1, total_amount: 200, guests: 1,
  },
  {
    id: 3, booking_ref: 'BK003', user_name: 'Carol Brown', email: 'carol@example.com',
    status: 'cancelled', payment_status: 'failed', room: { hotel_name: 'Alpine Lodge', room_type: 'standard' },
    check_in: '2027-04-01', check_out: '2027-04-03', nights: 2, total_amount: 300, guests: 3,
  },
];

describe('BookingsTableComponent', () => {
  let httpMock: HttpTestingController;
  let platformEvents: Subject<unknown>;
  let platformSyncService: {
    connect: jest.Mock;
    onAny: jest.Mock;
  };

  const setup = async () => {
    platformEvents = new Subject();
    platformSyncService = {
      connect: jest.fn(),
      onAny: jest.fn(() => platformEvents.asObservable()),
    };

    await TestBed.configureTestingModule({
      imports: [BookingsTableComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PlatformSyncService, useValue: platformSyncService },
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  };

  afterEach(() => {
    httpMock.verify();
  });

  it('loads bookings and filters the default upcoming tab on init', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`);
    req.flush({ bookings: sampleBookings, total: sampleBookings.length });

    expect(platformSyncService.connect).toHaveBeenCalled();
    expect(component.allBookings().length).toBe(3);
    expect(component.loadError()).toBe(false);
    expect(component.filteredBookings().map(item => item.booking_ref)).toEqual(['BK001', 'BK002']);
  });

  it('falls back to an empty booking list when the API response omits bookings', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`);
    req.flush({ total: 0 });

    expect(component.allBookings()).toEqual([]);
    expect(component.filteredBookings()).toEqual([]);
    expect(component.loadError()).toBe(false);
  });

  it('sets loadError on HTTP failure', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`);
    req.flush({}, { status: 500, statusText: 'Server Error' });

    expect(component.allBookings().length).toBe(0);
    expect(component.filteredBookings()).toEqual([]);
    expect(component.loadError()).toBe(true);
  });

  it('filters by search query against name, booking ref, and email', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush({ bookings: sampleBookings, total: 3 });

    component.searchQuery = 'alice';
    component.filter();
    expect(component.filteredBookings()[0].user_name).toBe('Alice Smith');

    component.searchQuery = 'BK002';
    component.filter();
    expect(component.filteredBookings()[0].booking_ref).toBe('BK002');

    component.searchQuery = 'carol@example.com';
    component.activeTab.set('cancelled');
    component.filter();
    expect(component.filteredBookings()[0].email).toBe('carol@example.com');
  });

  it('filters past, cancelled, expired, and refunded tabs and computes tab counts', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush({
      bookings: [
        ...sampleBookings,
        {
          id: 4, booking_ref: 'BK004', user_name: 'Donna Past', email: 'donna@example.com',
          status: 'completed', payment_status: 'paid', room: { hotel_name: 'Retro Stay', room_type: 'suite' },
          check_in: '2026-03-01', check_out: '2026-03-02', nights: 1, total_amount: 150,
        },
        {
          id: 5, booking_ref: 'BK005', user_name: 'Eli Expired', email: 'eli@example.com',
          status: 'expired', payment_status: 'failed', room: { hotel_name: 'Lapse Inn', room_type: 'standard' },
          check_in: '2027-05-01', check_out: '2027-05-02', nights: 1, total_amount: 90,
        },
        {
          id: 6, booking_ref: 'BK006', user_name: 'Fran Refund', email: 'fran@example.com',
          status: 'confirmed', payment_status: 'refunded', room: { hotel_name: 'Refund Hotel', room_type: 'deluxe' },
          check_in: '2027-06-01', check_out: '2027-06-03', nights: 2, total_amount: 220,
        },
      ],
      total: 6,
    });

    expect(component.tabCounts()).toEqual({
      upcoming: 3,
      past: 1,
      cancelled: 1,
      expired: 1,
      refunded: 1,
    });

    component.setTab('past');
    expect(component.filteredBookings().map(item => item.booking_ref)).toEqual(['BK004']);

    component.setTab('cancelled');
    expect(component.filteredBookings().map(item => item.booking_ref)).toEqual(['BK003']);

    component.setTab('expired');
    expect(component.filteredBookings().map(item => item.booking_ref)).toEqual(['BK005']);

    component.setTab('refunded');
    expect(component.filteredBookings().map(item => item.booking_ref)).toEqual(['BK006']);
  });

  it('returns empty state copy and icons for every tab', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush({ bookings: [], total: 0 });

    component.activeTab.set('upcoming');
    expect(component.emptyIcon()).toBe('📅');
    expect(component.emptyTitle()).toBe('No upcoming bookings');

    component.activeTab.set('past');
    expect(component.emptyIcon()).toBe('📸');
    expect(component.emptyTitle()).toBe('No past bookings');

    component.activeTab.set('cancelled');
    expect(component.emptyIcon()).toBe('🎉');
    expect(component.emptyTitle()).toBe('No cancellations');

    component.activeTab.set('expired');
    expect(component.emptyIcon()).toBe('⏱');
    expect(component.emptyTitle()).toBe('No expired bookings');

    component.activeTab.set('refunded');
    expect(component.emptyIcon()).toBe('↩');
    expect(component.emptyTitle()).toBe('No refunded bookings');
  });

  it('returns status and payment badge classes for all supported values', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush({ bookings: [], total: 0 });

    expect(component.getStatusBadge('confirmed')).toBe('badge--success');
    expect(component.getStatusBadge('pending')).toBe('badge--warning');
    expect(component.getStatusBadge('cancelled')).toBe('badge--error');
    expect(component.getStatusBadge('completed')).toBe('badge--info');
    expect(component.getStatusBadge('unknown')).toBe('');

    expect(component.getPaymentBadge('paid')).toBe('badge--success');
    expect(component.getPaymentBadge('pending')).toBe('badge--warning');
    expect(component.getPaymentBadge('failed')).toBe('badge--error');
    expect(component.getPaymentBadge('refunded')).toBe('badge--cyan');
    expect(component.getPaymentBadge('unknown')).toBe('');
  });

  it('formats guest counts and detailed adult/child/infant breakdowns', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush({ bookings: [], total: 0 });

    expect(component.formatGuests({} as never)).toBe('-');
    expect(component.formatGuests({ guests: 1 } as never)).toBe('1 guest');
    expect(component.formatGuests({ guests: 2 } as never)).toBe('2 guests');
    expect(component.formatGuests({ adults: 2, children: 1, infants: 1 } as never)).toBe('2A · 1C · 1I');
  });

  it('reloads bookings when realtime sync emits and unsubscribes on destroy', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    const componentAccess = component as unknown as { destroy$: Subject<void> };
    const nextSpy = jest.spyOn(componentAccess.destroy$, 'next');
    const completeSpy = jest.spyOn(componentAccess.destroy$, 'complete');

    component.ngOnInit();
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush({ bookings: sampleBookings, total: 3 });

    platformEvents.next({ type: 'booking-confirmed' });
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush({ bookings: sampleBookings.slice(0, 1), total: 1 });
    expect(component.allBookings()).toHaveLength(1);

    component.ngOnDestroy();
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});

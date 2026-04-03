/**
 * 100% branch-coverage tests for BookingsTableComponent
 * Branches:
 *   ngOnInit success  – sets allBookings, clears loadError, calls filter()
 *   ngOnInit error    – sets empty array, sets loadError=true, calls filter()
 *   filter()          – no search + no status / with search / with status / both
 *   getStatusBadge    – confirmed / pending / cancelled / completed / unknown
 *   getPaymentBadge   – paid / pending / failed / refunded / unknown
 */

import { of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { BookingsTableComponent } from './bookings-table.component';
import { environment } from '../../../environments/environment';

const BOOKINGS_URL = `${environment.apiUrl}/bookings?per_page=50`;

const sampleBookings = [
  {
    id: 1, booking_ref: 'BK001', user_name: 'Alice Smith', email: 'alice@example.com',
    status: 'confirmed', payment_status: 'paid', room: { hotel_name: 'Grand Hotel', room_type: 'suite' },
    check_in: '2027-03-10', check_out: '2027-03-12', nights: 2, total_amount: 400,
  },
  {
    id: 2, booking_ref: 'BK002', user_name: 'Bob Jones', email: 'bob@example.com',
    status: 'pending', payment_status: 'pending', room: { hotel_name: 'Sea View', room_type: 'deluxe' },
    check_in: '2027-03-15', check_out: '2027-03-16', nights: 1, total_amount: 200,
  },
  {
    id: 3, booking_ref: 'BK003', user_name: 'Carol Brown', email: 'carol@example.com',
    status: 'cancelled', payment_status: 'failed', room: { hotel_name: 'Alpine Lodge', room_type: 'standard' },
    check_in: '2027-04-01', check_out: '2027-04-03', nights: 2, total_amount: 300,
  },
];

describe('BookingsTableComponent', () => {
  let httpMock: HttpTestingController;

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [BookingsTableComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  };

  afterEach(() => {
    httpMock.verify();
  });

  it('loads bookings and filters on init (success path)', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`);
    req.flush({ bookings: sampleBookings, total: sampleBookings.length });

    expect(component.allBookings().length).toBe(3);
    expect(component.loadError()).toBe(false);
    expect(component.filteredBookings().length).toBe(3);
  });

  it('sets loadError on HTTP failure (error path)', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`);
    req.flush({}, { status: 500, statusText: 'Server Error' });

    expect(component.allBookings().length).toBe(0);
    expect(component.loadError()).toBe(true);
  });

  it('filter() with no criteria returns all bookings', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush({ bookings: sampleBookings, total: 3 });

    component.searchQuery = '';
    component.statusFilter = '';
    component.filter();

    expect(component.filteredBookings().length).toBe(3);
  });

  it('filter() by searchQuery (name match)', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush({ bookings: sampleBookings, total: 3 });

    component.searchQuery = 'alice';
    component.filter();

    expect(component.filteredBookings().length).toBe(1);
    expect(component.filteredBookings()[0].user_name).toBe('Alice Smith');
  });

  it('filter() by searchQuery (booking_ref match)', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush({ bookings: sampleBookings, total: 3 });

    component.searchQuery = 'BK002';
    component.filter();

    expect(component.filteredBookings().length).toBe(1);
    expect(component.filteredBookings()[0].booking_ref).toBe('BK002');
  });

  it('filter() by statusFilter only', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush({ bookings: sampleBookings, total: 3 });

    component.searchQuery = '';
    component.statusFilter = 'pending';
    component.filter();

    expect(component.filteredBookings().length).toBe(1);
    expect(component.filteredBookings()[0].status).toBe('pending');
  });

  it('filter() with both search and statusFilter', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush({ bookings: sampleBookings, total: 3 });

    component.searchQuery = 'carol';
    component.statusFilter = 'cancelled';
    component.filter();

    expect(component.filteredBookings().length).toBe(1);
    expect(component.filteredBookings()[0].user_name).toBe('Carol Brown');
  });

  it('getStatusBadge returns correct classes for all status values', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush({ bookings: [], total: 0 });

    expect(component.getStatusBadge('confirmed')).toBe('badge--success');
    expect(component.getStatusBadge('pending')).toBe('badge--warning');
    expect(component.getStatusBadge('cancelled')).toBe('badge--error');
    expect(component.getStatusBadge('completed')).toBe('badge--info');
    expect(component.getStatusBadge('unknown')).toBe('');
  });

  it('getPaymentBadge returns correct classes for all payment status values', async () => {
    await setup();
    const fixture = TestBed.createComponent(BookingsTableComponent);
    const component = fixture.componentInstance;
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush({ bookings: [], total: 0 });

    expect(component.getPaymentBadge('paid')).toBe('badge--success');
    expect(component.getPaymentBadge('pending')).toBe('badge--warning');
    expect(component.getPaymentBadge('failed')).toBe('badge--error');
    expect(component.getPaymentBadge('refunded')).toBe('badge--cyan');
    expect(component.getPaymentBadge('unknown')).toBe('');
  });
});

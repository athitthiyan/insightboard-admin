import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { IncidentsComponent } from './incidents.component';
import { environment } from '../../../environments/environment';

describe('IncidentsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentsComponent, HttpClientTestingModule],
    }).compileComponents();
  });

  it('loads incidents and triggers recovery actions', () => {
    const fixture = TestBed.createComponent(IncidentsComponent);
    const component = fixture.componentInstance;
    const httpMock = TestBed.inject(HttpTestingController);

    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/ops/incidents`).flush({
      orphan_paid_bookings: [
        { booking_id: 1, booking_ref: 'BK1', status: 'confirmed', payment_status: 'paid', room_id: 4, email: 'a@example.com' },
      ],
      stale_processing_bookings: [
        { booking_id: 2, booking_ref: 'BK2', status: 'processing', payment_status: 'processing', room_id: 5, email: 'b@example.com', transaction_ref: 'TXN-1' },
      ],
      active_holds: [
        { booking_id: 3, booking_ref: 'BK3', status: 'pending', payment_status: 'pending', room_id: 6, email: 'c@example.com' },
      ],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('BK1');
    expect(fixture.nativeElement.textContent).toContain('BK2');
    expect(fixture.nativeElement.textContent).toContain('BK3');

    component.forceConfirm(1);
    httpMock.expectOne(`${environment.apiUrl}/ops/bookings/1/force-confirm`).flush({});
    httpMock.expectOne(`${environment.apiUrl}/ops/incidents`).flush({
      orphan_paid_bookings: [],
      stale_processing_bookings: [],
      active_holds: [],
    });

    component.releaseHold(3);
    httpMock.expectOne(`${environment.apiUrl}/ops/bookings/3/release-hold`).flush({});
    httpMock.expectOne(`${environment.apiUrl}/ops/incidents`).flush({
      orphan_paid_bookings: [],
      stale_processing_bookings: [],
      active_holds: [],
    });

    httpMock.verify();
  });

  it('falls back to an empty state when incidents fail to load', () => {
    const fixture = TestBed.createComponent(IncidentsComponent);
    const httpMock = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/ops/incidents`).flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No orphan paid bookings.');
    expect(fixture.nativeElement.textContent).toContain('No stale processing bookings.');
    expect(fixture.nativeElement.textContent).toContain('No active hold incidents.');
    httpMock.verify();
  });

  it('reloads incidents after failed recovery actions too', () => {
    const fixture = TestBed.createComponent(IncidentsComponent);
    const component = fixture.componentInstance;
    const httpMock = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/ops/incidents`).flush({
      orphan_paid_bookings: [],
      stale_processing_bookings: [],
      active_holds: [],
    });

    component.forceConfirm(1);
    httpMock.expectOne(`${environment.apiUrl}/ops/bookings/1/force-confirm`).flush({}, { status: 500, statusText: 'Error' });
    httpMock.expectOne(`${environment.apiUrl}/ops/incidents`).flush({
      orphan_paid_bookings: [],
      stale_processing_bookings: [],
      active_holds: [],
    });

    component.releaseHold(2);
    httpMock.expectOne(`${environment.apiUrl}/ops/bookings/2/release-hold`).flush({}, { status: 500, statusText: 'Error' });
    httpMock.expectOne(`${environment.apiUrl}/ops/incidents`).flush({
      orphan_paid_bookings: [],
      stale_processing_bookings: [],
      active_holds: [],
    });

    httpMock.verify();
  });
});

/**
 * 100% branch-coverage tests for AnalyticsService
 * All 3 methods tested with correct HTTP verbs, URLs, and params.
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { AnalyticsService } from './analytics.service';
import { environment } from '../../../environments/environment';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AnalyticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAnalytics uses the default 30-day window', () => {
    service.getAnalytics().subscribe();
    const req = httpMock.expectOne(
      r => r.url === `${environment.apiUrl}/analytics` && r.params.get('days') === '30',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      kpis: {}, daily_stats: [], monthly_revenue: [],
      payment_breakdown: [], room_type_breakdown: [],
    });
  });

  it('getAnalytics passes a custom days value', () => {
    service.getAnalytics(7).subscribe();
    const req = httpMock.expectOne(
      r => r.url === `${environment.apiUrl}/analytics` && r.params.get('days') === '7',
    );
    req.flush({ kpis: {}, daily_stats: [], monthly_revenue: [], payment_breakdown: [], room_type_breakdown: [] });
  });

  it('getRecentBookings passes the limit param', () => {
    service.getRecentBookings(5).subscribe();
    const req = httpMock.expectOne(
      r =>
        r.url === `${environment.apiUrl}/analytics/recent-bookings` &&
        r.params.get('limit') === '5',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ bookings: [], total: 0 });
  });

  it('getRecentBookings uses default limit of 10', () => {
    service.getRecentBookings().subscribe();
    const req = httpMock.expectOne(
      r =>
        r.url === `${environment.apiUrl}/analytics/recent-bookings` &&
        r.params.get('limit') === '10',
    );
    req.flush({ bookings: [], total: 0 });
  });

  it('getRevenueStats fetches revenue-stats endpoint', () => {
    service.getRevenueStats().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/analytics/revenue-stats`);
    expect(req.request.method).toBe('GET');
    req.flush({ this_month: 1000, last_month: 800, growth_percentage: 25 });
  });
});

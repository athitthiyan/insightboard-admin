import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface KPIStats {
  total_bookings: number;
  total_revenue: number;
  success_rate: number;
  avg_booking_value: number;
  bookings_today: number;
  revenue_today: number;
  pending_bookings: number;
  failed_payments: number;
}

export interface DailyStats {
  date: string;
  bookings: number;
  revenue: number;
}

export interface AnalyticsResponse {
  kpis: KPIStats;
  daily_stats: DailyStats[];
  monthly_revenue: { month: string; revenue: number; bookings: number }[];
  payment_breakdown: { status: string; count: number; percentage: number }[];
  room_type_breakdown: { room_type: string; count: number; revenue: number }[];
}

export interface RecentBooking {
  id: number;
  booking_ref: string;
  user_name: string;
  email: string;
  status: string;
  payment_status?: string;
  check_in: string;
  check_out?: string;
  nights?: number;
  total_amount: number;
  room?: {
    hotel_name: string;
    room_type: string;
  } | null;
}

export interface RecentBookingsResponse {
  bookings: RecentBooking[];
  total: number;
}

export interface RevenueStatsResponse {
  this_month: number;
  last_month: number;
  growth_percentage: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/analytics`;

  getAnalytics(days = 30): Observable<AnalyticsResponse> {
    return this.http.get<AnalyticsResponse>(this.base, {
      params: new HttpParams().set('days', days)
    });
  }

  getRecentBookings(limit = 10): Observable<RecentBookingsResponse> {
    return this.http.get<RecentBookingsResponse>(`${this.base}/recent-bookings`, {
      params: new HttpParams().set('limit', limit)
    });
  }

  getRevenueStats(): Observable<RevenueStatsResponse> {
    return this.http.get<RevenueStatsResponse>(`${this.base}/revenue-stats`);
  }
}

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

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/analytics`;

  getAnalytics(days = 30): Observable<AnalyticsResponse> {
    return this.http.get<AnalyticsResponse>(this.base, {
      params: new HttpParams().set('days', days)
    });
  }

  getRecentBookings(limit = 10): Observable<any> {
    return this.http.get(`${this.base}/recent-bookings`, {
      params: new HttpParams().set('limit', limit)
    });
  }

  getRevenueStats(): Observable<any> {
    return this.http.get(`${this.base}/revenue-stats`);
  }
}

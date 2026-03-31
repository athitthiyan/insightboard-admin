import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
    }).pipe(catchError(() => of(this.getMockAnalytics())));
  }

  getRecentBookings(limit = 10): Observable<any> {
    return this.http.get(`${this.base}/recent-bookings`, {
      params: new HttpParams().set('limit', limit)
    }).pipe(catchError(() => of({ bookings: this.getMockBookings(), total: 5 })));
  }

  getRevenueStats(): Observable<any> {
    return this.http.get(`${this.base}/revenue-stats`)
      .pipe(catchError(() => of({ this_month: 24850, last_month: 19200, growth_percentage: 29.4 })));
  }

  private getMockAnalytics(): AnalyticsResponse {
    const now = new Date();
    const dailyStats: DailyStats[] = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      return {
        date: d.toISOString().split('T')[0],
        bookings: Math.floor(Math.random() * 12) + 2,
        revenue: Math.floor(Math.random() * 4000) + 500,
      };
    });

    return {
      kpis: {
        total_bookings: 284,
        total_revenue: 148750,
        success_rate: 91.4,
        avg_booking_value: 523.80,
        bookings_today: 7,
        revenue_today: 3640,
        pending_bookings: 12,
        failed_payments: 8,
      },
      daily_stats: dailyStats,
      monthly_revenue: [
        { month: 'Oct 2025', revenue: 18400, bookings: 42 },
        { month: 'Nov 2025', revenue: 22100, bookings: 55 },
        { month: 'Dec 2025', revenue: 31500, bookings: 78 },
        { month: 'Jan 2026', revenue: 19200, bookings: 48 },
        { month: 'Feb 2026', revenue: 23900, bookings: 61 },
        { month: 'Mar 2026', revenue: 24850, bookings: 64 },
      ],
      payment_breakdown: [
        { status: 'success',  count: 260, percentage: 91.5 },
        { status: 'failed',   count: 16,  percentage: 5.6 },
        { status: 'pending',  count: 6,   percentage: 2.1 },
        { status: 'refunded', count: 2,   percentage: 0.7 },
      ],
      room_type_breakdown: [
        { room_type: 'penthouse', count: 48,  revenue: 40800 },
        { room_type: 'suite',     count: 95,  revenue: 39900 },
        { room_type: 'deluxe',    count: 112, revenue: 31360 },
        { room_type: 'standard',  count: 29,  revenue: 5800 },
      ],
    };
  }

  private getMockBookings() {
    return [
      { id:1, booking_ref:'BK12345678', user_name:'Sarah Mitchell', email:'sarah@example.com', room:{ hotel_name:'The Grand Azure', room_type:'penthouse' }, check_in:'2026-04-01T14:00:00Z', check_out:'2026-04-04T12:00:00Z', nights:3, total_amount:2890, status:'confirmed', payment_status:'paid', created_at:new Date().toISOString() },
      { id:2, booking_ref:'BK87654321', user_name:'James Park', email:'james@example.com', room:{ hotel_name:'Serenity Beach Resort', room_type:'suite' }, check_in:'2026-04-05T14:00:00Z', check_out:'2026-04-07T12:00:00Z', nights:2, total_amount:950.40, status:'confirmed', payment_status:'paid', created_at:new Date(Date.now()-86400000).toISOString() },
      { id:3, booking_ref:'BK11223344', user_name:'Priya Sharma', email:'priya@example.com', room:{ hotel_name:'Alpine Summit Lodge', room_type:'deluxe' }, check_in:'2026-04-10T14:00:00Z', check_out:'2026-04-12T12:00:00Z', nights:2, total_amount:637.60, status:'pending', payment_status:'pending', created_at:new Date(Date.now()-172800000).toISOString() },
      { id:4, booking_ref:'BK44556677', user_name:'Kenji Tanaka', email:'kenji@example.com', room:{ hotel_name:'Kyoto Garden Inn', room_type:'suite' }, check_in:'2026-04-15T14:00:00Z', check_out:'2026-04-17T12:00:00Z', nights:2, total_amount:706.20, status:'confirmed', payment_status:'paid', created_at:new Date(Date.now()-259200000).toISOString() },
      { id:5, booking_ref:'BK99887766', user_name:'Emma Wilson', email:'emma@example.com', room:{ hotel_name:'Desert Mirage Palace', room_type:'suite' }, check_in:'2026-04-20T14:00:00Z', check_out:'2026-04-23T12:00:00Z', nights:3, total_amount:1779, status:'cancelled', payment_status:'refunded', created_at:new Date(Date.now()-345600000).toISOString() },
    ];
  }
}

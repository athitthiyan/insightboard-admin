import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../core/services/analytics.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-bookings-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>All <span>Bookings</span></h1>
      <p>Complete list of all hotel reservations</p>
    </div>

    <!-- Filters -->
    <div class="table-toolbar">
      <input type="text" [(ngModel)]="searchQuery" placeholder="🔍 Search by guest or booking ref..." class="form-control table-toolbar__search" (input)="filter()" />
      <select [(ngModel)]="statusFilter" class="form-control table-toolbar__select" (change)="filter()">
        <option value="">All Status</option>
        <option value="confirmed">Confirmed</option>
        <option value="pending">Pending</option>
        <option value="cancelled">Cancelled</option>
        <option value="completed">Completed</option>
      </select>
      <div class="table-toolbar__stats">
        Total: <strong>{{ filteredBookings().length }}</strong>
      </div>
    </div>

    <!-- Table -->
    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Ref</th>
            <th>Guest</th>
            <th>Hotel</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Nights</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Payment</th>
          </tr>
        </thead>
        <tbody>
          @for (b of filteredBookings(); track b.id) {
            <tr class="data-row">
              <td><span class="mono-text">{{ b.booking_ref }}</span></td>
              <td>
                <div class="guest-cell">
                  <div class="avatar">{{ b.user_name[0] }}</div>
                  <div>
                    <strong>{{ b.user_name }}</strong>
                    <span>{{ b.email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <strong>{{ b.room?.hotel_name }}</strong>
                <span class="room-pill">{{ b.room?.room_type }}</span>
              </td>
              <td>{{ b.check_in | date:'MMM d, yyyy' }}</td>
              <td>{{ b.check_out | date:'MMM d, yyyy' }}</td>
              <td>{{ b.nights }}</td>
              <td><strong class="amount">\${{ b.total_amount | number:'1.0-0' }}</strong></td>
              <td><span class="badge" [class]="getStatusBadge(b.status)">{{ b.status }}</span></td>
              <td><span class="badge" [class]="getPaymentBadge(b.payment_status)">{{ b.payment_status }}</span></td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-toolbar {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;

    }

    .table-toolbar__search { flex: 1; min-width: 200px; }
    .table-toolbar__select { width: 160px; }
    .table-toolbar__stats { font-size: 14px; color: var(--ib-text-muted); }
    .table-toolbar__stats strong { color: var(--ib-text); }

    .data-table-wrap {
      background: var(--ib-surface);
      border: 1px solid var(--ib-border);
      border-radius: 16px;
      overflow: auto;
      animation: fadeInUp 0.5s ease;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 800px;

      th {
        padding: 12px 16px;
        text-align: left;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--ib-primary-light);
        border-bottom: 1px solid var(--ib-border);
        background: rgba(99,102,241,0.03);
        white-space: nowrap;
      }

      td {
        padding: 14px 16px;
        font-size: 13px;
        color: var(--ib-text-muted);
        border-bottom: 1px solid var(--ib-border);
        vertical-align: middle;

        strong { display: block; color: var(--ib-text); font-size: 13px; }
        span   { font-size: 11px; }
      }

      tr:last-child td { border-bottom: none; }
    }

    .data-row:hover td { background: rgba(255,255,255,0.02); }

    .mono-text {
      font-family: var(--font-mono);
      font-size: 11px !important;
      color: var(--ib-text-muted) !important;
    }

    .guest-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .avatar {
      width: 30px;
      height: 30px;
      border-radius: 7px;
      background: linear-gradient(135deg, var(--ib-primary), var(--ib-primary-dark));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .room-pill {
      display: inline-block;
      font-size: 10px !important;
      background: rgba(99,102,241,0.1);
      color: var(--ib-primary-light) !important;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: capitalize;
      margin-top: 2px;
    }

    .amount { color: var(--ib-text) !important; font-size: 14px !important; font-weight: 700 !important; }
  `],
})
export class BookingsTableComponent implements OnInit {
  private http = inject(HttpClient);

  allBookings = signal<any[]>([]);
  filteredBookings = signal<any[]>([]);
  searchQuery = '';
  statusFilter = '';

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/bookings`, {
      params: new HttpParams().set('per_page', 50)
    }).subscribe({
      next: res => { this.allBookings.set(res.bookings || []); this.filter(); },
      error: () => {
        const mock = [
          { id:1, booking_ref:'BK12345678', user_name:'Sarah Mitchell', email:'sarah@example.com', room:{ hotel_name:'The Grand Azure', room_type:'penthouse' }, check_in:'2026-04-01T14:00:00Z', check_out:'2026-04-04T12:00:00Z', nights:3, total_amount:2890, status:'confirmed', payment_status:'paid' },
          { id:2, booking_ref:'BK87654321', user_name:'James Park', email:'james@example.com', room:{ hotel_name:'Serenity Beach Resort', room_type:'suite' }, check_in:'2026-04-05T14:00:00Z', check_out:'2026-04-07T12:00:00Z', nights:2, total_amount:950.40, status:'confirmed', payment_status:'paid' },
          { id:3, booking_ref:'BK11223344', user_name:'Priya Sharma', email:'priya@example.com', room:{ hotel_name:'Alpine Summit Lodge', room_type:'deluxe' }, check_in:'2026-04-10T14:00:00Z', check_out:'2026-04-12T12:00:00Z', nights:2, total_amount:637.60, status:'pending', payment_status:'pending' },
          { id:4, booking_ref:'BK44556677', user_name:'Kenji Tanaka', email:'kenji@example.com', room:{ hotel_name:'Kyoto Garden Inn', room_type:'suite' }, check_in:'2026-04-15T14:00:00Z', check_out:'2026-04-17T12:00:00Z', nights:2, total_amount:706.20, status:'confirmed', payment_status:'paid' },
          { id:5, booking_ref:'BK99887766', user_name:'Emma Wilson', email:'emma@example.com', room:{ hotel_name:'Desert Mirage Palace', room_type:'suite' }, check_in:'2026-04-20T14:00:00Z', check_out:'2026-04-23T12:00:00Z', nights:3, total_amount:1779, status:'cancelled', payment_status:'refunded' },
        ];
        this.allBookings.set(mock);
        this.filter();
      },
    });
  }

  filter() {
    let results = this.allBookings();
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      results = results.filter(b =>
        b.user_name.toLowerCase().includes(q) ||
        b.booking_ref.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q)
      );
    }
    if (this.statusFilter) {
      results = results.filter(b => b.status === this.statusFilter);
    }
    this.filteredBookings.set(results);
  }

  getStatusBadge(s: string) { return { confirmed:'badge--success', pending:'badge--warning', cancelled:'badge--error', completed:'badge--info' }[s] || ''; }
  getPaymentBadge(s: string) { return { paid:'badge--success', pending:'badge--warning', failed:'badge--error', refunded:'badge--cyan' }[s] || ''; }
}

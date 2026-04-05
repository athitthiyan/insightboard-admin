import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface BookingTableRow {
  id: number;
  booking_ref: string;
  user_name: string;
  email: string;
  check_in: string;
  check_out: string;
  nights: number;
  total_amount: number;
  status: string;
  payment_status: string;
  room?: {
    hotel_name: string;
    room_type: string;
  } | null;
}

interface BookingListResponse {
  bookings?: BookingTableRow[];
}

@Component({
  selector: 'app-bookings-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>All <span>Bookings</span></h1>
      <p>Complete list of all hotel reservations</p>
    </div>

    <div class="table-toolbar">
      <input
        type="text"
        [(ngModel)]="searchQuery"
        placeholder="Search by guest or booking ref..."
        class="form-control table-toolbar__search"
        (input)="filter()"
      />

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
              <td data-label="Ref"><span class="mono-text">{{ b.booking_ref }}</span></td>
              <td data-label="Guest">
                <div class="guest-cell">
                  <div class="avatar">{{ b.user_name[0] }}</div>
                  <div>
                    <strong>{{ b.user_name }}</strong>
                    <span>{{ b.email }}</span>
                  </div>
                </div>
              </td>
              <td data-label="Hotel">
                <strong>{{ b.room?.hotel_name }}</strong>
                <span class="room-pill">{{ b.room?.room_type }}</span>
              </td>
              <td data-label="Check-in">{{ b.check_in | date:'MMM d, yyyy' }}</td>
              <td data-label="Check-out">{{ b.check_out | date:'MMM d, yyyy' }}</td>
              <td data-label="Nights">{{ b.nights }}</td>
              <td data-label="Amount"><strong class="amount">\${{ b.total_amount | number:'1.0-0' }}</strong></td>
              <td data-label="Status"><span class="badge" [class]="getStatusBadge(b.status)">{{ b.status }}</span></td>
              <td data-label="Payment"><span class="badge" [class]="getPaymentBadge(b.payment_status)">{{ b.payment_status }}</span></td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-toolbar {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
      margin-bottom: 20px;
    }

    .table-toolbar__search {
      width: 100%;
      min-width: 0;
    }

    .table-toolbar__select {
      width: 100%;
    }

    .table-toolbar__stats {
      font-size: 14px;
      color: var(--ib-text-muted);
    }

    .table-toolbar__stats strong {
      color: var(--ib-text);
    }

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
    }

    .data-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--ib-primary-light);
      border-bottom: 1px solid var(--ib-border);
      background: rgba(99, 102, 241, 0.03);
      white-space: nowrap;
    }

    .data-table td {
      padding: 14px 16px;
      font-size: 13px;
      color: var(--ib-text-muted);
      border-bottom: 1px solid var(--ib-border);
      vertical-align: middle;
    }

    .data-table td strong {
      display: block;
      color: var(--ib-text);
      font-size: 13px;
    }

    .data-table td span {
      font-size: 11px;
    }

    .data-table tr:last-child td {
      border-bottom: none;
    }

    .data-row:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

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
      background: rgba(99, 102, 241, 0.1);
      color: var(--ib-primary-light) !important;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: capitalize;
      margin-top: 2px;
    }

    .amount {
      color: var(--ib-text) !important;
      font-size: 14px !important;
      font-weight: 700 !important;
    }

    @media (max-width: 767px) {
      .data-table,
      .data-table thead,
      .data-table tbody,
      .data-table tr,
      .data-table td {
        display: block;
        width: 100%;
      }

      .data-table {
        min-width: 0;
      }

      .data-table thead {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
      }

      .data-table tbody {
        display: grid;
        gap: 12px;
        padding: 12px;
      }

      .data-row {
        border: 1px solid var(--ib-border);
        border-radius: 14px;
        padding: 12px 14px;
        background: rgba(255, 255, 255, 0.015);
      }

      .data-table td {
        padding: 8px 0;
        border-bottom: none;
      }

      .data-table td::before {
        content: attr(data-label);
        display: block;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--ib-primary-light);
        margin-bottom: 4px;
      }
    }

    @media (min-width: 768px) {
      .table-toolbar {
        flex-direction: row;
        align-items: center;
        flex-wrap: wrap;
      }

      .table-toolbar__search {
        flex: 1;
        min-width: 200px;
      }

      .table-toolbar__select {
        width: 160px;
      }
    }
  `],
})
export class BookingsTableComponent implements OnInit {
  private http = inject(HttpClient);

  allBookings = signal<BookingTableRow[]>([]);
  filteredBookings = signal<BookingTableRow[]>([]);
  loadError = signal(false);
  searchQuery = '';
  statusFilter = '';

  ngOnInit() {
    this.http.get<BookingListResponse>(`${environment.apiUrl}/bookings`, {
      params: new HttpParams().set('per_page', 50),
    }).subscribe({
      next: res => {
        this.allBookings.set(res.bookings || []);
        this.loadError.set(false);
        this.filter();
      },
      error: () => {
        this.allBookings.set([]);
        this.loadError.set(true);
        this.filter();
      },
    });
  }

  filter() {
    let results = this.allBookings();

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      results = results.filter((b: BookingTableRow) =>
        b.user_name.toLowerCase().includes(q) ||
        b.booking_ref.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q),
      );
    }

    if (this.statusFilter) {
      results = results.filter((b: BookingTableRow) => b.status === this.statusFilter);
    }

    this.filteredBookings.set(results);
  }

  getStatusBadge(s: string) {
    return { confirmed: 'badge--success', pending: 'badge--warning', cancelled: 'badge--error', completed: 'badge--info' }[s] || '';
  }

  getPaymentBadge(s: string) {
    return { paid: 'badge--success', pending: 'badge--warning', failed: 'badge--error', refunded: 'badge--cyan' }[s] || '';
  }
}

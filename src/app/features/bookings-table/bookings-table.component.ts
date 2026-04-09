import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlatformSyncService } from '../../core/services/platform-sync.service';

type AdminTabKey = 'upcoming' | 'past' | 'cancelled' | 'expired' | 'refunded';

interface AdminTab {
  key: AdminTabKey;
  label: string;
  icon: string;
}

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
  guests?: number;
  adults?: number;
  children?: number;
  infants?: number;
  room?: {
    hotel_name: string;
    room_type: string;
  } | null;
}

interface BookingListResponse {
  bookings?: BookingTableRow[];
}

// ── Shared status colors (synchronized across all portals) ──────────
const STATUS_COLORS: Record<string, { color: string; bg: string; badge: string }> = {
  confirmed:  { color: '#4ade80', bg: 'rgba(34,197,94,0.15)',  badge: 'badge--success' },
  pending:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', badge: 'badge--warning' },
  processing: { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', badge: 'badge--info' },
  cancelled:  { color: '#f87171', bg: 'rgba(239,68,68,0.15)',  badge: 'badge--error' },
  completed:  { color: '#818cf8', bg: 'rgba(99,102,241,0.15)', badge: 'badge--info' },
  expired:    { color: '#9ca3af', bg: 'rgba(107,114,128,0.15)', badge: 'badge--muted' },
};

const PAYMENT_COLORS: Record<string, { badge: string }> = {
  paid:     { badge: 'badge--success' },
  pending:  { badge: 'badge--warning' },
  failed:   { badge: 'badge--error' },
  refunded: { badge: 'badge--cyan' },
};

@Component({
  selector: 'app-bookings-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>All <span>Bookings</span></h1>
      <p>Complete list of all hotel reservations — synchronized across customer, partner, and admin portals.</p>
    </div>

    <!-- Stats pills (same structure as customer + partner) -->
    @if (allBookings().length > 0) {
      <div class="stats-row">
        <div class="stat-pill stat-pill--upcoming">
          <span class="stat-pill__count">{{ tabCounts().upcoming }}</span>
          <span class="stat-pill__label">Upcoming</span>
        </div>
        <div class="stat-pill stat-pill--past">
          <span class="stat-pill__count">{{ tabCounts().past }}</span>
          <span class="stat-pill__label">Past</span>
        </div>
        <div class="stat-pill stat-pill--cancelled">
          <span class="stat-pill__count">{{ tabCounts().cancelled }}</span>
          <span class="stat-pill__label">Cancelled</span>
        </div>
        <div class="stat-pill stat-pill--expired">
          <span class="stat-pill__count">{{ tabCounts().expired }}</span>
          <span class="stat-pill__label">Expired</span>
        </div>
        <div class="stat-pill stat-pill--refunded">
          <span class="stat-pill__count">{{ tabCounts().refunded }}</span>
          <span class="stat-pill__label">Refunded</span>
        </div>
      </div>
    }

    <!-- Tabs (Admin gets: Upcoming, Past, Cancelled, Expired, Refunded) -->
    <nav class="tabs" role="tablist">
      @for (tab of tabs; track tab.key) {
        <button
          role="tab"
          class="tab"
          [class.tab--active]="activeTab() === tab.key"
          [attr.aria-selected]="activeTab() === tab.key"
          (click)="setTab(tab.key)"
        >
          <span class="tab__icon">{{ tab.icon }}</span>
          {{ tab.label }}
          @if (tabCounts()[tab.key] > 0) {
            <span class="tab__badge">{{ tabCounts()[tab.key] }}</span>
          }
        </button>
      }
    </nav>

    <div class="table-toolbar">
      <input
        type="text"
        [(ngModel)]="searchQuery"
        placeholder="Search by guest, booking ref, or email..."
        class="form-control table-toolbar__search"
        (input)="filter()"
      />

      <div class="table-toolbar__stats">
        Showing: <strong>{{ filteredBookings().length }}</strong>
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
            <th>Guests</th>
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
              <td data-label="Guests" class="guest-breakdown-cell">
                <span>{{ formatGuests(b) }}</span>
              </td>
              <td data-label="Nights">{{ b.nights }}</td>
              <td data-label="Amount"><strong class="amount">₹{{ b.total_amount | number:'1.0-0' }}</strong></td>
              <td data-label="Status"><span class="badge" [class]="getStatusBadge(b.status)">{{ b.status }}</span></td>
              <td data-label="Payment"><span class="badge" [class]="getPaymentBadge(b.payment_status)">{{ b.payment_status }}</span></td>
            </tr>
          } @empty {
            <tr>
              <td colspan="10" class="empty-table-cell">
                <span class="empty-icon">{{ emptyIcon() }}</span>
                <span>{{ emptyTitle() }}</span>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .stats-row {
      display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;
    }
    .stat-pill {
      display: flex; flex-direction: column; align-items: center;
      padding: 10px 16px; border-radius: 14px;
      border: 1px solid var(--sv-border); background: rgba(255,255,255,0.02); min-width: 76px;
    }
    .stat-pill__count { font-size: 1.2rem; font-weight: 700; }
    .stat-pill__label { font-size: .58rem; text-transform: uppercase; letter-spacing: .08em; color: var(--sv-text-muted); margin-top: 2px; }
    .stat-pill--upcoming .stat-pill__count { color: #4ade80; }
    .stat-pill--past .stat-pill__count { color: #818cf8; }
    .stat-pill--cancelled .stat-pill__count { color: #f87171; }
    .stat-pill--expired .stat-pill__count { color: #9ca3af; }
    .stat-pill--refunded .stat-pill__count { color: #a78bfa; }

    /* ── Tabs ── */
    .tabs {
      display: flex; gap: 4px; margin-bottom: 16px;
      border-bottom: 1px solid var(--sv-border); overflow-x: auto;
    }
    .tab {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 16px; background: none; border: none;
      color: var(--sv-text-muted); font-size: 13px; font-weight: 500;
      border-bottom: 2px solid transparent; margin-bottom: -1px;
      cursor: pointer; transition: all 150ms; white-space: nowrap;
    }
    .tab:hover { color: var(--sv-text); }
    .tab--active { color: var(--sv-gold, #d6b86b); border-bottom-color: var(--sv-gold, #d6b86b); }
    .tab__icon { font-size: .85rem; }
    .tab__badge {
      background: var(--sv-gold, #d6b86b); color: #000;
      font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 99px;
    }

    /* ── Empty ── */
    .empty-table-cell {
      text-align: center; padding: 60px 20px !important; color: var(--sv-text-muted);
      font-size: .85rem;
    }
    .empty-icon { display: block; font-size: 2rem; margin-bottom: 8px; }

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

    .table-toolbar__stats {
      font-size: 14px;
      color: var(--sv-text-muted);
    }

    .table-toolbar__stats strong {
      color: var(--sv-text);
    }

    .data-table-wrap {
      background: var(--sv-surface);
      border: 1px solid var(--sv-border);
      border-radius: 16px;
      overflow: auto;
      animation: fadeInUp 0.5s ease;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--sv-gold-light);
      border-bottom: 1px solid var(--sv-border);
      background: rgba(214, 184, 107, 0.03);
      white-space: nowrap;
    }

    .data-table td {
      padding: 14px 16px;
      font-size: 13px;
      color: var(--sv-text-muted);
      border-bottom: 1px solid var(--sv-border);
      vertical-align: middle;
    }

    .data-table td strong {
      display: block;
      color: var(--sv-text);
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
      color: var(--sv-text-muted) !important;
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
      background: var(--sv-gradient-gold);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: #0a0f1e;
      flex-shrink: 0;
    }

    .room-pill {
      display: inline-block;
      font-size: 10px !important;
      background: rgba(214, 184, 107, 0.1);
      color: var(--sv-gold-light) !important;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: capitalize;
      margin-top: 2px;
    }

    .amount {
      color: var(--sv-text) !important;
      font-size: 14px !important;
      font-weight: 700 !important;
    }

    /* Mobile default: card-based table layout */
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
      border: 1px solid var(--sv-border);
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
      color: var(--sv-primary-light);
      margin-bottom: 4px;
    }

    .stats-row { gap: 6px; }
    .stat-pill { min-width: 60px; padding: 8px 10px; }
    .stat-pill__count { font-size: 1rem; }

    /* md (768px+): restore table layout */
    @media (min-width: 768px) {
      .data-table { display: table; width: 100%; min-width: 700px; }
      .data-table thead { display: table-header-group; position: static; width: auto; height: auto; overflow: visible; clip: auto; }
      .data-table tbody { display: table-row-group; gap: 0; padding: 0; }
      .data-table tr, .data-row { display: table-row; border: none; border-radius: 0; padding: 0; background: transparent; }
      .data-table td { display: table-cell; border-bottom: 1px solid var(--sv-border); padding: 10px 10px; font-size: 12px; }
      .data-table td::before { display: none; }
      .data-table th { padding: 10px 10px; font-size: 10px; }
      .avatar { width: 26px; height: 26px; font-size: 11px; }
      .tabs { overflow-x: auto; }
      .tab { padding: 8px 12px; font-size: 12px; }
      .stat-pill { min-width: 64px; padding: 8px 12px; }

      .table-toolbar {
        flex-direction: row;
        align-items: center;
        flex-wrap: wrap;
      }

      .table-toolbar__search {
        flex: 1;
        min-width: 200px;
      }
    }

    /* lg (1024px+): full table */
    @media (min-width: 1024px) {
      .data-table { min-width: 800px; }
      .data-table th { padding: 12px 14px; font-size: 11px; }
      .data-table td { padding: 14px 12px; font-size: 13px; }
      .avatar { width: 30px; height: 30px; font-size: 12px; }
      .stat-pill { min-width: 76px; }
    }
  `],
})
export class BookingsTableComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private platformSync = inject(PlatformSyncService);
  private destroy$ = new Subject<void>();

  allBookings = signal<BookingTableRow[]>([]);
  filteredBookings = signal<BookingTableRow[]>([]);
  loadError = signal(false);
  searchQuery = '';
  activeTab = signal<AdminTabKey>('upcoming');

  readonly tabs: AdminTab[] = [
    { key: 'upcoming', label: 'Upcoming', icon: '📅' },
    { key: 'past', label: 'Past', icon: '✓' },
    { key: 'cancelled', label: 'Cancelled', icon: '✕' },
    { key: 'expired', label: 'Expired', icon: '⏱' },
    { key: 'refunded', label: 'Refunded', icon: '↩' },
  ];

  ngOnInit() {
    this.loadBookings();
    this.initRealtimeSync();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBookings(): void {
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

  /** Subscribe to booking/payment/refund WebSocket events for auto-refresh */
  private initRealtimeSync(): void {
    this.platformSync.connect();

    this.platformSync.onAny(
      'booking-created',
      'booking-confirmed',
      'booking-cancelled',
      'booking-expired',
      'payment-completed',
      'refund-initiated',
      'refund-completed',
      'inventory-updated',
      'payout-settled',
    ).pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.loadBookings();
    });
  }

  setTab(tab: AdminTabKey): void {
    this.activeTab.set(tab);
    this.filter();
  }

  tabCounts(): Record<AdminTabKey, number> {
    const all = this.allBookings();
    const now = new Date();
    return {
      upcoming: all.filter(b =>
        (b.status === 'confirmed' || b.status === 'pending' || b.status === 'processing') &&
        new Date(b.check_out) >= now
      ).length,
      past: all.filter(b =>
        b.status === 'completed' ||
        (b.status === 'confirmed' && new Date(b.check_out) < now)
      ).length,
      cancelled: all.filter(b => b.status === 'cancelled').length,
      expired: all.filter(b => b.status === 'expired').length,
      refunded: all.filter(b => b.payment_status === 'refunded').length,
    };
  }

  filter() {
    const tab = this.activeTab();
    const now = new Date();
    let results = this.allBookings();

    // Apply tab filter
    switch (tab) {
      case 'upcoming':
        results = results.filter(b =>
          (b.status === 'confirmed' || b.status === 'pending' || b.status === 'processing') &&
          new Date(b.check_out) >= now
        );
        break;
      case 'past':
        results = results.filter(b =>
          b.status === 'completed' ||
          (b.status === 'confirmed' && new Date(b.check_out) < now)
        );
        break;
      case 'cancelled':
        results = results.filter(b => b.status === 'cancelled');
        break;
      case 'expired':
        results = results.filter(b => b.status === 'expired');
        break;
      case 'refunded':
        results = results.filter(b => b.payment_status === 'refunded');
        break;
    }

    // Apply search filter
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      results = results.filter((b: BookingTableRow) =>
        b.user_name.toLowerCase().includes(q) ||
        b.booking_ref.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q),
      );
    }

    this.filteredBookings.set(results);
  }

  emptyIcon(): string {
    const tab = this.activeTab();
    if (tab === 'upcoming') return '📅';
    if (tab === 'past') return '📸';
    if (tab === 'cancelled') return '🎉';
    if (tab === 'expired') return '⏱';
    return '↩';
  }

  emptyTitle(): string {
    const tab = this.activeTab();
    if (tab === 'upcoming') return 'No upcoming bookings';
    if (tab === 'past') return 'No past bookings';
    if (tab === 'cancelled') return 'No cancellations';
    if (tab === 'expired') return 'No expired bookings';
    return 'No refunded bookings';
  }

  getStatusBadge(s: string) {
    return STATUS_COLORS[s]?.badge || '';
  }

  getPaymentBadge(s: string) {
    return PAYMENT_COLORS[s]?.badge || '';
  }

  formatGuests(b: BookingTableRow): string {
    if (b.adults || b.children || b.infants) {
      const parts: string[] = [];
      if (b.adults) parts.push(b.adults + 'A');
      if (b.children) parts.push(b.children + 'C');
      if (b.infants) parts.push(b.infants + 'I');
      return parts.join(' · ');
    }
    return b.guests ? b.guests + ' guest' + (b.guests !== 1 ? 's' : '') : '-';
  }
}

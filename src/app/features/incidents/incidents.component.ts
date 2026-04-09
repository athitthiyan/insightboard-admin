import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

type IncidentBooking = {
  booking_id: number;
  booking_ref: string;
  status: string;
  payment_status: string;
  room_id: number;
  email: string;
  transaction_ref?: string | null;
};

type IncidentDashboard = {
  orphan_paid_bookings: IncidentBooking[];
  stale_processing_bookings: IncidentBooking[];
  active_holds: IncidentBooking[];
};

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h1>Incident <span>Recovery</span></h1>
      <p>Manual recovery queue for payment mismatch, stuck bookings, and hold issues.</p>
    </div>

    <div class="incident-grid">
      <section class="incident-card">
        <div class="incident-card__header">
          <h2>Orphan paid bookings</h2>
          <span class="badge">{{ data()?.orphan_paid_bookings?.length || 0 }}</span>
        </div>
        @for (item of data()?.orphan_paid_bookings || []; track item.booking_id) {
          <article class="incident-row">
            <div>
              <strong>{{ item.booking_ref }}</strong>
              <p>{{ item.email }}</p>
            </div>
            <button class="btn btn--primary btn--sm" (click)="forceConfirm(item.booking_id)">Force confirm</button>
          </article>
        } @empty {
          <p class="incident-empty">No orphan paid bookings.</p>
        }
      </section>

      <section class="incident-card">
        <div class="incident-card__header">
          <h2>Stale processing</h2>
          <span class="badge badge--warning">{{ data()?.stale_processing_bookings?.length || 0 }}</span>
        </div>
        @for (item of data()?.stale_processing_bookings || []; track item.booking_id) {
          <article class="incident-row">
            <div>
              <strong>{{ item.booking_ref }}</strong>
              <p>{{ item.transaction_ref || 'No transaction ref' }}</p>
            </div>
            <button class="btn btn--ghost btn--sm" (click)="releaseHold(item.booking_id)">Release hold</button>
          </article>
        } @empty {
          <p class="incident-empty">No stale processing bookings.</p>
        }
      </section>

      <section class="incident-card">
        <div class="incident-card__header">
          <h2>Active holds</h2>
          <span class="badge badge--cyan">{{ data()?.active_holds?.length || 0 }}</span>
        </div>
        @for (item of data()?.active_holds || []; track item.booking_id) {
          <article class="incident-row">
            <div>
              <strong>{{ item.booking_ref }}</strong>
              <p>{{ item.status }} • {{ item.payment_status }}</p>
            </div>
            <button class="btn btn--ghost btn--sm" (click)="releaseHold(item.booking_id)">Release hold</button>
          </article>
        } @empty {
          <p class="incident-empty">No active hold incidents.</p>
        }
      </section>
    </div>
  `,
  styles: [`
    /* Mobile default: single column */
    .incident-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .incident-card {
      background: var(--sv-surface);
      border: 1px solid var(--sv-border);
      border-radius: 14px;
      padding: 14px;
    }

    .incident-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }

    .incident-card h2 {
      font-size: 1rem;
      color: var(--sv-text);
    }

    .incident-row {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      padding: 12px 0;
      border-top: 1px solid var(--sv-border);
    }

    .incident-row strong {
      color: var(--sv-text);
      display: block;
    }

    .incident-row p,
    .incident-empty {
      color: var(--sv-text-muted);
      font-size: 13px;
      margin: 4px 0 0;
    }

    /* md (768px+): 2-column layout */
    @media (min-width: 768px) {
      .incident-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .incident-grid > :last-child {
        grid-column: 1 / -1;
      }
      .incident-card {
        padding: 18px;
        border-radius: 16px;
      }
      .incident-row {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
    }

    /* lg (1024px+): 3-column layout */
    @media (min-width: 1024px) {
      .incident-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .incident-grid > :last-child {
        grid-column: auto;
      }
    }
  `],
})
export class IncidentsComponent implements OnInit {
  private http = inject(HttpClient);
  readonly data = signal<IncidentDashboard | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.http.get<IncidentDashboard>(`${environment.apiUrl}/ops/incidents`).subscribe({
      next: response => this.data.set(response),
      error: () => this.data.set({ orphan_paid_bookings: [], stale_processing_bookings: [], active_holds: [] }),
    });
  }

  releaseHold(bookingId: number): void {
    this.http.post(`${environment.apiUrl}/ops/bookings/${bookingId}/release-hold`, {}).subscribe({
      next: () => this.load(),
      error: () => this.load(),
    });
  }

  forceConfirm(bookingId: number): void {
    this.http.post(`${environment.apiUrl}/ops/bookings/${bookingId}/force-confirm`, {}).subscribe({
      next: () => this.load(),
      error: () => this.load(),
    });
  }
}

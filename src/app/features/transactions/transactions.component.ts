import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

type RefundStatus =
  | 'refund_requested'
  | 'refund_initiated'
  | 'refund_processing'
  | 'refund_success'
  | 'refund_failed'
  | 'refund_reversed';

interface TransactionBooking {
  id?: number;
  user_name?: string;
  payment_status?: string;
  refund_status?: RefundStatus;
  refund_gateway_reference?: string | null;
  room?: { hotel_name?: string };
}

interface TransactionRow {
  id: number;
  transaction_ref: string;
  amount: number;
  currency: string;
  payment_method: string;
  card_last4?: string | null;
  card_brand?: string | null;
  status: string;
  created_at: string;
  booking?: TransactionBooking;
}

interface TransactionListResponse {
  transactions?: TransactionRow[] | null;
  total?: number;
}

interface RefundActionResponse {
  timeline: {
    refund_status: RefundStatus;
    gateway_reference?: string | null;
  };
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Payment <span>Transactions</span></h1>
      <p>All financial transactions processed through Stayvora</p>
    </div>

    <div class="txn-summary">
      @for (s of summaryCards; track s.label) {
        <div class="summary-card" [class]="'summary-card--' + s.color">
          <span class="summary-card__icon">{{ s.icon }}</span>
          <div>
            <strong>{{ s.value }}</strong>
            <span>{{ s.label }}</span>
          </div>
        </div>
      }
    </div>

    <div class="table-toolbar">
      <select [(ngModel)]="statusFilter" class="form-control table-toolbar__select" (change)="loadTransactions()">
        <option value="">All Status</option>
        <option value="success">Success</option>
        <option value="failed">Failed</option>
        <option value="pending">Pending</option>
        <option value="refunded">Refunded</option>
      </select>
    </div>

    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Ref</th>
            <th>Guest</th>
            <th>Hotel</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (t of transactions(); track t.id) {
            <tr class="data-row">
              <td data-label="Ref"><span class="mono-text">{{ t.transaction_ref }}</span></td>
              <td data-label="Guest">{{ t.booking?.user_name || '—' }}</td>
              <td data-label="Hotel">{{ t.booking?.room?.hotel_name || '—' }}</td>
              <td data-label="Amount"><strong class="amount">\${{ t.amount | number:'1.2-2' }}</strong></td>
              <td data-label="Method">{{ t.card_brand || t.payment_method }} @if (t.card_last4) { ••{{ t.card_last4 }} }</td>
              <td data-label="Status">
                <span class="badge" [class]="getBadge(t.status)">{{ t.status }}</span>
                @if (t.booking?.refund_status) {
                  <div class="refund-chip">{{ formatRefundStatus(t.booking!.refund_status!) }}</div>
                }
              </td>
              <td data-label="Date" class="mono-text">{{ t.created_at | date:'MMM d, HH:mm' }}</td>
              <td data-label="Actions">
                <div class="row-actions">
                  @if (canForceInitiateRefund(t)) {
                    <button class="action-link" type="button" (click)="forceInitiateRefund(t)">Force initiate</button>
                  }
                  @if (canRetryRefund(t)) {
                    <button class="action-link" type="button" (click)="retryRefund(t)">Retry failed</button>
                  }
                  @if (canMarkCompleted(t)) {
                    <button class="action-link" type="button" (click)="markRefundCompleted(t)">Mark completed</button>
                  }
                  @if (canReverseRefund(t)) {
                    <button class="action-link" type="button" (click)="reverseRefund(t)">Reverse</button>
                  }
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (actionMessage()) {
      <p class="action-feedback action-feedback--success">{{ actionMessage() }}</p>
    }
    @if (actionError()) {
      <p class="action-feedback action-feedback--error">{{ actionError() }}</p>
    }
  `,
  styles: [`
    .txn-summary {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-bottom: 20px;
      animation: fadeInUp 0.5s ease;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      background: var(--ib-surface);
      border: 1px solid var(--ib-border);
      border-radius: 14px;
      transition: all 0.2s;
    }

    .summary-card:hover {
      border-color: var(--ib-border-2);
    }

    .summary-card strong {
      display: block;
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--ib-text);
    }

    .summary-card span {
      font-size: 12px;
      color: var(--ib-text-muted);
    }

    .summary-card__icon {
      font-size: 1.8rem;
    }

    .summary-card--green strong { color: #22c55e; }
    .summary-card--red strong { color: #ef4444; }
    .summary-card--yellow strong { color: #f59e0b; }
    .summary-card--cyan strong { color: #22d3ee; }

    .table-toolbar {
      margin-bottom: 16px;
    }

    .table-toolbar__select {
      width: 100%;
    }

    .data-table-wrap {
      background: var(--ib-surface);
      border: 1px solid var(--ib-border);
      border-radius: 16px;
      overflow: auto;
      animation: fadeInUp 0.5s ease 0.1s both;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 900px;
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
    }

    .data-table td {
      padding: 14px 16px;
      font-size: 13px;
      color: var(--ib-text-muted);
      border-bottom: 1px solid var(--ib-border);
      vertical-align: middle;
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
    }

    .amount {
      color: var(--ib-text) !important;
      font-size: 14px !important;
      font-weight: 700 !important;
    }

    .refund-chip {
      margin-top: 4px;
      color: #c4b5fd;
      font-size: 11px;
      text-transform: capitalize;
    }

    .row-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .action-link {
      background: transparent;
      border: 1px solid var(--ib-border);
      border-radius: 999px;
      color: var(--ib-text);
      cursor: pointer;
      font-size: 11px;
      padding: 4px 8px;
    }

    .action-feedback {
      margin-top: 12px;
      font-size: 13px;
    }

    .action-feedback--success { color: #22c55e; }
    .action-feedback--error { color: #ef4444; }

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
      .txn-summary {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .table-toolbar__select {
        width: 160px;
      }
    }
  `],
})
export class TransactionsComponent implements OnInit {
  private http = inject(HttpClient);

  transactions = signal<TransactionRow[]>([]);
  actionMessage = signal('');
  actionError = signal('');
  statusFilter = '';

  summaryCards = [
    { icon: 'C', label: 'Total Transactions', value: '—', color: 'cyan' },
    { icon: 'S', label: 'Successful', value: '—', color: 'green' },
    { icon: 'F', label: 'Failed', value: '—', color: 'red' },
    { icon: '$', label: 'Total Revenue', value: '—', color: 'yellow' },
  ];

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    let params = new HttpParams().set('per_page', 50);

    if (this.statusFilter) {
      params = params.set('status', this.statusFilter);
    }

    this.http.get<TransactionListResponse>(`${environment.apiUrl}/payments/transactions`, { params }).subscribe({
      next: res => {
        const txns = res.transactions || [];
        this.transactions.set(txns);
        this.summaryCards[0].value = String(res.total || txns.length);
        this.summaryCards[1].value = String(txns.filter(t => t.status === 'success').length);
        this.summaryCards[2].value = String(txns.filter(t => t.status === 'failed').length);
        const rev = txns
          .filter(t => t.status === 'success')
          .reduce((sum, txn) => sum + txn.amount, 0);
        this.summaryCards[3].value = `$${rev.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      },
      error: () => {
        this.transactions.set([
          {
            id: 1,
            transaction_ref: 'TXN-ABC12345',
            amount: 987.5,
            currency: 'USD',
            payment_method: 'card',
            card_last4: '4242',
            card_brand: 'Visa',
            status: 'success',
            created_at: new Date().toISOString(),
            booking: { id: 10, user_name: 'Sarah Mitchell', room: { hotel_name: 'The Grand Azure' } },
          },
          {
            id: 2,
            transaction_ref: 'TXN-DEF67890',
            amount: 504,
            currency: 'USD',
            payment_method: 'card',
            card_last4: '5555',
            card_brand: 'Mastercard',
            status: 'success',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            booking: { id: 11, user_name: 'James Park', room: { hotel_name: 'Serenity Beach Resort' } },
          },
          {
            id: 3,
            transaction_ref: 'TXN-GHI11223',
            amount: 336,
            currency: 'USD',
            payment_method: 'card',
            card_last4: '0002',
            card_brand: 'Visa',
            status: 'failed',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            booking: { id: 12, user_name: 'Priya Sharma', room: { hotel_name: 'Alpine Summit Lodge' } },
          },
        ]);
        this.summaryCards[0].value = '3';
        this.summaryCards[1].value = '2';
        this.summaryCards[2].value = '1';
        this.summaryCards[3].value = '$1,491';
      },
    });
  }

  getBadge(status: string) {
    return { success: 'badge--success', failed: 'badge--error', pending: 'badge--warning', refunded: 'badge--cyan' }[status] || '';
  }

  formatRefundStatus(status: RefundStatus): string {
    return status.replace(/_/g, ' ');
  }

  canForceInitiateRefund(transaction: TransactionRow): boolean {
    return transaction.booking?.payment_status === 'paid' && !transaction.booking?.refund_status;
  }

  canRetryRefund(transaction: TransactionRow): boolean {
    return transaction.booking?.refund_status === 'refund_failed';
  }

  canMarkCompleted(transaction: TransactionRow): boolean {
    return !!transaction.booking?.refund_status
      && ['refund_requested', 'refund_initiated', 'refund_processing', 'refund_failed'].includes(transaction.booking.refund_status);
  }

  canReverseRefund(transaction: TransactionRow): boolean {
    return transaction.booking?.refund_status === 'refund_success';
  }

  forceInitiateRefund(transaction: TransactionRow): void {
    this.updateRefundState(transaction, 'initiate', { reason: 'Manual admin refund initiation' });
  }

  retryRefund(transaction: TransactionRow): void {
    this.updateRefundState(transaction, 'retry', { reason: 'Retry failed refund' });
  }

  markRefundCompleted(transaction: TransactionRow): void {
    this.updateRefundState(transaction, 'complete', { reason: 'Manual refund completion' });
  }

  reverseRefund(transaction: TransactionRow): void {
    this.updateRefundState(transaction, 'reverse', { reason: 'Incorrect refund reversed by admin' });
  }

  private updateRefundState(
    transaction: TransactionRow,
    action: 'initiate' | 'retry' | 'complete' | 'reverse',
    payload: { reason: string },
  ): void {
    const bookingId = transaction.booking?.id;
    if (!bookingId) {
      this.actionError.set('Booking is missing for this transaction.');
      return;
    }

    this.actionMessage.set('');
    this.actionError.set('');
    this.http
      .post<RefundActionResponse>(
        `${environment.apiUrl}/payments/refunds/${bookingId}/${action}`,
        payload,
      )
      .subscribe({
        next: response => {
          this.transactions.update(rows =>
            rows.map(row =>
              row.id === transaction.id
                ? {
                    ...row,
                    booking: {
                      ...row.booking,
                      refund_status: response.timeline.refund_status,
                      refund_gateway_reference: response.timeline.gateway_reference ?? row.booking?.refund_gateway_reference,
                    },
                  }
                : row,
            ),
          );
          this.actionMessage.set('Refund workflow updated.');
        },
        error: () => {
          this.actionError.set('We could not update the refund workflow right now.');
        },
      });
  }
}

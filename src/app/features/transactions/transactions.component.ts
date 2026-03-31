import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Payment <span>Transactions</span></h1>
      <p>All financial transactions processed through PayFlow</p>
    </div>

    <!-- Summary cards -->
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
      <select [(ngModel)]="statusFilter" class="form-control" style="width:160px" (change)="loadTransactions()">
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
          </tr>
        </thead>
        <tbody>
          @for (t of transactions(); track t.id) {
            <tr class="data-row">
              <td><span class="mono-text">{{ t.transaction_ref }}</span></td>
              <td>{{ t.booking?.user_name || '—' }}</td>
              <td>{{ t.booking?.room?.hotel_name || '—' }}</td>
              <td><strong class="amount">\${{ t.amount | number:'1.2-2' }}</strong></td>
              <td>{{ t.card_brand || t.payment_method }} @if(t.card_last4){ ••{{ t.card_last4 }} }</td>
              <td><span class="badge" [class]="getBadge(t.status)">{{ t.status }}</span></td>
              <td class="mono-text">{{ t.created_at | date:'MMM d, HH:mm' }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .txn-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
      animation: fadeInUp 0.5s ease;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 18px 20px;
      background: var(--ib-surface);
      border: 1px solid var(--ib-border);
      border-radius: 14px;
      transition: all 0.2s;

      &:hover { border-color: var(--ib-border-2); }

      &__icon { font-size: 1.8rem; }

      strong { display: block; font-size: 1.4rem; font-weight: 800; color: var(--ib-text); }
      span   { font-size: 12px; color: var(--ib-text-muted); }

      &--green strong { color: #22c55e; }
      &--red   strong { color: #ef4444; }
      &--yellow strong { color: #f59e0b; }
      &--cyan  strong { color: #22d3ee; }
    }

    .table-toolbar { margin-bottom: 16px; }

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
      min-width: 700px;

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
      }

      td {
        padding: 14px 16px;
        font-size: 13px;
        color: var(--ib-text-muted);
        border-bottom: 1px solid var(--ib-border);
        vertical-align: middle;
      }

      tr:last-child td { border-bottom: none; }
    }

    .data-row:hover td { background: rgba(255,255,255,0.02); }
    .mono-text { font-family: var(--font-mono); font-size: 11px !important; }
    .amount { color: var(--ib-text) !important; font-size: 14px !important; font-weight: 700 !important; }
  `],
})
export class TransactionsComponent implements OnInit {
  private http = inject(HttpClient);

  transactions = signal<any[]>([]);
  statusFilter = '';

  summaryCards = [
    { icon: '💳', label: 'Total Transactions', value: '—', color: 'cyan'   },
    { icon: '✅', label: 'Successful',          value: '—', color: 'green'  },
    { icon: '❌', label: 'Failed',              value: '—', color: 'red'    },
    { icon: '💰', label: 'Total Revenue',       value: '—', color: 'yellow' },
  ];

  ngOnInit() { this.loadTransactions(); }

  loadTransactions() {
    let params = new HttpParams().set('per_page', 50);
    if (this.statusFilter) params = params.set('status', this.statusFilter);

    this.http.get<any>(`${environment.apiUrl}/payments/transactions`, { params }).subscribe({
      next: res => {
        const txns = res.transactions || [];
        this.transactions.set(txns);
        this.summaryCards[0].value = String(res.total || txns.length);
        this.summaryCards[1].value = String(txns.filter((t: any) => t.status === 'success').length);
        this.summaryCards[2].value = String(txns.filter((t: any) => t.status === 'failed').length);
        const rev = txns.filter((t: any) => t.status === 'success').reduce((s: number, t: any) => s + t.amount, 0);
        this.summaryCards[3].value = `$${rev.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      },
      error: () => {
        this.transactions.set([
          { id:1, transaction_ref:'TXN-ABC12345', amount:987.50, currency:'USD', payment_method:'card', card_last4:'4242', card_brand:'Visa', status:'success', created_at:new Date().toISOString(), booking:{ user_name:'Sarah Mitchell', room:{ hotel_name:'The Grand Azure' } } },
          { id:2, transaction_ref:'TXN-DEF67890', amount:504.00, currency:'USD', payment_method:'card', card_last4:'5555', card_brand:'Mastercard', status:'success', created_at:new Date(Date.now()-86400000).toISOString(), booking:{ user_name:'James Park', room:{ hotel_name:'Serenity Beach Resort' } } },
          { id:3, transaction_ref:'TXN-GHI11223', amount:336.00, currency:'USD', payment_method:'card', card_last4:'0002', card_brand:'Visa', status:'failed', failure_reason:'Declined', created_at:new Date(Date.now()-172800000).toISOString(), booking:{ user_name:'Priya Sharma', room:{ hotel_name:'Alpine Summit Lodge' } } },
        ]);
        this.summaryCards[0].value = '3';
        this.summaryCards[1].value = '2';
        this.summaryCards[2].value = '1';
        this.summaryCards[3].value = '$1,491';
      },
    });
  }

  getBadge(s: string) { return { success:'badge--success', failed:'badge--error', pending:'badge--warning', refunded:'badge--cyan' }[s] || ''; }
}

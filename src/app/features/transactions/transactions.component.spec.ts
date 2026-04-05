/**
 * 100% branch-coverage tests for TransactionsComponent (InsightBoard)
 * Branches:
 *   ngOnInit → loadTransactions
 *   loadTransactions: success path – sets transactions, updates summary cards
 *   loadTransactions: error path  – falls back to hardcoded mock data
 *   loadTransactions: with statusFilter set (params include status)
 *   loadTransactions: without statusFilter (params do not include status)
 *   getBadge: success / failed / pending / refunded / unknown
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TransactionsComponent } from './transactions.component';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiUrl}/payments/transactions`;

const sampleTransactions = [
  { id: 1, transaction_ref: 'TXN-001', amount: 500, status: 'success', payment_method: 'card', card_brand: 'Visa', card_last4: '4242', created_at: new Date().toISOString() },
  { id: 2, transaction_ref: 'TXN-002', amount: 200, status: 'failed',  payment_method: 'card', card_brand: 'MC',   card_last4: '5555', created_at: new Date().toISOString() },
  { id: 3, transaction_ref: 'TXN-003', amount: 150, status: 'pending', payment_method: 'mock', card_brand: null,   card_last4: null,   created_at: new Date().toISOString() },
];

describe('TransactionsComponent', () => {
  let httpMock: HttpTestingController;

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  };

  afterEach(() => httpMock.verify());

  it('loads transactions and computes summary cards on success', async () => {
    await setup();
    const fixture = TestBed.createComponent(TransactionsComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    const req = httpMock.expectOne(r => r.url === BASE_URL);
    req.flush({ transactions: sampleTransactions, total: sampleTransactions.length });

    expect(component.transactions().length).toBe(3);
    expect(component.summaryCards[0].value).toBe('3');   // total
    expect(component.summaryCards[1].value).toBe('1');   // success count
    expect(component.summaryCards[2].value).toBe('1');   // failed count
    // revenue: only success transactions → $500
    expect(component.summaryCards[3].value).toContain('500');
  });

  it('falls back to derived totals when the API omits the total field', async () => {
    await setup();
    const fixture = TestBed.createComponent(TransactionsComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    const req = httpMock.expectOne(r => r.url === BASE_URL);
    req.flush({ transactions: sampleTransactions });

    expect(component.transactions().length).toBe(3);
    expect(component.summaryCards[0].value).toBe('3');
  });

  it('handles a success payload with missing transactions by using an empty list', async () => {
    await setup();
    const fixture = TestBed.createComponent(TransactionsComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    const req = httpMock.expectOne(r => r.url === BASE_URL);
    req.flush({ total: 0, transactions: null });

    expect(component.transactions()).toEqual([]);
    expect(component.summaryCards[0].value).toBe('0');
    expect(component.summaryCards[1].value).toBe('0');
    expect(component.summaryCards[2].value).toBe('0');
    expect(component.summaryCards[3].value).toBe('$0');
  });

  it('falls back to mock data on HTTP error', async () => {
    await setup();
    const fixture = TestBed.createComponent(TransactionsComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    const req = httpMock.expectOne(r => r.url === BASE_URL);
    req.flush({}, { status: 500, statusText: 'Error' });

    // Fallback: 3 hardcoded transactions
    expect(component.transactions().length).toBe(3);
    expect(component.summaryCards[0].value).toBe('3');
    expect(component.summaryCards[1].value).toBe('2');
    expect(component.summaryCards[2].value).toBe('1');
    expect(component.summaryCards[3].value).toBe('$1,491');
  });

  it('loadTransactions includes statusFilter in params when set', async () => {
    await setup();
    const fixture = TestBed.createComponent(TransactionsComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    // Consume the initial load
    httpMock.expectOne(r => r.url === BASE_URL).flush({ transactions: [], total: 0 });

    // Now set a filter and reload
    component.statusFilter = 'success';
    component.loadTransactions();
    const req = httpMock.expectOne(
      r => r.url === BASE_URL && r.params.get('status') === 'success',
    );
    req.flush({ transactions: sampleTransactions.filter(t => t.status === 'success'), total: 1 });

    expect(component.transactions().length).toBe(1);
  });

  it('loadTransactions omits status param when statusFilter is empty', async () => {
    await setup();
    const fixture = TestBed.createComponent(TransactionsComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    const req = httpMock.expectOne(r => r.url === BASE_URL && !r.params.has('status'));
    req.flush({ transactions: [], total: 0 });
    expect(component.transactions().length).toBe(0);
  });

  it('getBadge returns correct CSS classes for all statuses', async () => {
    await setup();
    const fixture = TestBed.createComponent(TransactionsComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    httpMock.expectOne(r => r.url === BASE_URL).flush({ transactions: [], total: 0 });

    expect(component.getBadge('success')).toBe('badge--success');
    expect(component.getBadge('failed')).toBe('badge--error');
    expect(component.getBadge('pending')).toBe('badge--warning');
    expect(component.getBadge('refunded')).toBe('badge--cyan');
    expect(component.getBadge('unknown')).toBe('');
  });
});

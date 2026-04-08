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
  { id: 1, transaction_ref: 'TXN-001', amount: 500, status: 'success', payment_method: 'card', card_brand: 'Visa', card_last4: '4242', created_at: new Date().toISOString(), booking: { id: 101, payment_status: 'paid', room: { hotel_name: 'Ocean View' } } },
  { id: 2, transaction_ref: 'TXN-002', amount: 200, status: 'failed',  payment_method: 'card', card_brand: 'MC',   card_last4: '5555', created_at: new Date().toISOString(), booking: { id: 102, refund_status: 'refund_failed', room: { hotel_name: 'Hill Lodge' } } },
  { id: 3, transaction_ref: 'TXN-003', amount: 150, status: 'pending', payment_method: 'mock', card_brand: null,   card_last4: null,   created_at: new Date().toISOString(), booking: { id: 103, refund_status: 'refund_success', room: { hotel_name: 'City Nest' } } },
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
    expect(component.summaryCards[3].value).toBe('₹0');
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

  it('exposes refund action visibility helpers', async () => {
    await setup();
    const fixture = TestBed.createComponent(TransactionsComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    httpMock.expectOne(r => r.url === BASE_URL).flush({ transactions: sampleTransactions, total: 3 });

    expect(component.canForceInitiateRefund(sampleTransactions[0] as never)).toBe(true);
    expect(component.canRetryRefund(sampleTransactions[1] as never)).toBe(true);
    expect(component.canMarkCompleted(sampleTransactions[1] as never)).toBe(true);
    expect(component.canReverseRefund(sampleTransactions[2] as never)).toBe(true);
    expect(component.formatRefundStatus('refund_processing')).toBe('refund processing');
  });

  it('updates local transaction refund state after admin actions', async () => {
    await setup();
    const fixture = TestBed.createComponent(TransactionsComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    httpMock.expectOne(r => r.url === BASE_URL).flush({ transactions: sampleTransactions, total: 3 });

    component.forceInitiateRefund(sampleTransactions[0] as never);
    httpMock
      .expectOne(`${environment.apiUrl}/payments/refunds/101/initiate`)
      .flush({ timeline: { refund_status: 'refund_initiated', gateway_reference: 'RFND-101' } });
    expect(component.transactions()[0].booking?.refund_status).toBe('refund_initiated');

    component.retryRefund(sampleTransactions[1] as never);
    httpMock
      .expectOne(`${environment.apiUrl}/payments/refunds/102/retry`)
      .flush({ timeline: { refund_status: 'refund_processing' } });
    expect(component.transactions()[1].booking?.refund_status).toBe('refund_processing');

    component.markRefundCompleted(component.transactions()[1] as never);
    httpMock
      .expectOne(`${environment.apiUrl}/payments/refunds/102/complete`)
      .flush({ timeline: { refund_status: 'refund_success' } });
    expect(component.transactions()[1].booking?.refund_status).toBe('refund_success');

    component.reverseRefund(sampleTransactions[2] as never);
    httpMock
      .expectOne(`${environment.apiUrl}/payments/refunds/103/reverse`)
      .flush({ timeline: { refund_status: 'refund_reversed' } });
    expect(component.transactions()[2].booking?.refund_status).toBe('refund_reversed');
    expect(component.actionMessage()).toBe('Refund workflow updated.');
  });

  it('surfaces refund action errors and missing booking guards', async () => {
    await setup();
    const fixture = TestBed.createComponent(TransactionsComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    httpMock.expectOne(r => r.url === BASE_URL).flush({ transactions: sampleTransactions, total: 3 });

    component.forceInitiateRefund({ ...sampleTransactions[0], booking: undefined } as never);
    expect(component.actionError()).toBe('Booking is missing for this transaction.');

    component.forceInitiateRefund(sampleTransactions[0] as never);
    httpMock
      .expectOne(`${environment.apiUrl}/payments/refunds/101/initiate`)
      .flush({}, { status: 500, statusText: 'Error' });
    expect(component.actionError()).toBe('We could not update the refund workflow right now.');
  });

  it('opens, closes, and confirms the refund dialog', async () => {
    await setup();
    const fixture = TestBed.createComponent(TransactionsComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    httpMock.expectOne(r => r.url === BASE_URL).flush({ transactions: sampleTransactions, total: 3 });

    component.openRefundDialog(sampleTransactions[0] as never);
    expect(component.refundDialogOpen()).toBe(true);
    expect(component.refundDialogTxn()?.transaction_ref).toBe('TXN-001');

    component.closeRefundDialog();
    expect(component.refundDialogOpen()).toBe(false);
    expect(component.refundDialogTxn()).toBeNull();

    component.openRefundDialog(sampleTransactions[0] as never);
    component.confirmForceRefund();
    httpMock
      .expectOne(`${environment.apiUrl}/payments/refunds/101/initiate`)
      .flush({ timeline: { refund_status: 'refund_initiated' } });

    expect(component.refundDialogOpen()).toBe(false);
    expect(component.refundDialogTxn()).toBeNull();
  });

  it('safely handles confirmForceRefund when no dialog transaction exists', async () => {
    await setup();
    const fixture = TestBed.createComponent(TransactionsComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();
    httpMock.expectOne(r => r.url === BASE_URL).flush({ transactions: [], total: 0 });

    component.confirmForceRefund();

    expect(component.refundDialogOpen()).toBe(false);
    expect(component.refundDialogTxn()).toBeNull();
  });
});

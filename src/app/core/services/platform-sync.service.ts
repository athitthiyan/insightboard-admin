/**
 * ═══════════════════════════════════════════════════════════════════════
 *  STAYVORA — Platform Sync Service (Admin Portal)
 *  Shared event-driven sync via WebSocket / polling fallback.
 *  Identical contract to customer + partner PlatformSyncService.
 * ═══════════════════════════════════════════════════════════════════════
 */
import { Injectable, signal, OnDestroy } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Subject, interval, Subscription } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

export type PlatformEventType =
  | 'room-updated'
  | 'price-updated'
  | 'availability-updated'
  | 'booking-created'
  | 'booking-confirmed'
  | 'booking-cancelled'
  | 'booking-expired'
  | 'payment-completed'
  | 'refund-initiated'
  | 'refund-completed'
  | 'inventory-updated'
  | 'payout-settled';

export interface PlatformEvent {
  type: PlatformEventType;
  payload: Record<string, unknown>;
  timestamp: string;
  source: 'customer' | 'partner' | 'admin' | 'system';
}

@Injectable({ providedIn: 'root' })
export class PlatformSyncService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private events$ = new Subject<PlatformEvent>();
  private ws: WebSocket | null = null;
  private pollingSubscription: Subscription | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connected = signal(false);
  lastEvent = signal<PlatformEvent | null>(null);

  readonly onEvent$ = this.events$.asObservable();

  on(type: PlatformEventType) {
    return this.events$.pipe(filter(e => e.type === type));
  }

  onAny(...types: PlatformEventType[]) {
    return this.events$.pipe(filter(e => types.includes(e.type)));
  }

  connect(): void {
    this.tryWebSocket();
  }

  emit(event: PlatformEvent): void {
    this.events$.next(event);
    this.lastEvent.set(event);
  }

  private tryWebSocket(): void {
    let token = '';
    try {
      token = localStorage.getItem('access_token') || '';
    } catch {
      // localStorage may not be available in SSR or private browsing mode
    }
    const wsUrl = environment.apiUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://') + '/ws/events';

    try {
      this.ws = new WebSocket(wsUrl, ['access_token', token]);
      this.ws.onopen = () => {
        this.connected.set(true);
        this.reconnectAttempts = 0;
        this.stopPolling();
      };
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as PlatformEvent;
          this.events$.next(data);
          this.lastEvent.set(data);
        } catch { /* ignore malformed */ }
      };
      this.ws.onclose = () => {
        this.connected.set(false);
        this.scheduleReconnect();
      };
      this.ws.onerror = () => {
        this.connected.set(false);
        this.ws?.close();
        this.startPollingFallback();
      };
    } catch {
      this.startPollingFallback();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.startPollingFallback();
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    setTimeout(() => this.tryWebSocket(), delay);
  }

  private startPollingFallback(): void {
    if (this.pollingSubscription) return;
    this.pollingSubscription = interval(15000).pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.emit({
        type: 'room-updated',
        payload: { action: 'poll-refresh' },
        timestamp: new Date().toISOString(),
        source: 'system',
      });
    });
  }

  private stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.ws?.close();
    this.stopPolling();
  }
}

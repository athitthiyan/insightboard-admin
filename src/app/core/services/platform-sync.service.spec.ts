import { TestBed } from '@angular/core/testing';

import { PlatformEvent, PlatformSyncService } from './platform-sync.service';

type MockSocket = {
  url: string;
  protocols: string | string[];
  onopen: (() => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: (() => void) | null;
  onerror: (() => void) | null;
  close: jest.Mock;
};

describe('PlatformSyncService', () => {
  const originalWebSocket = global.WebSocket;
  const sockets: MockSocket[] = [];

  function installWebSocketMock(factory?: (url: string, protocols?: string | string[]) => MockSocket): void {
    const websocketMock = jest.fn((url: string, protocols?: string | string[]) => {
      const socket = factory
        ? factory(url, protocols)
        : {
            url,
            protocols: protocols || [],
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null,
            close: jest.fn(),
          };
      sockets.push(socket);
      return socket;
    });
    Object.defineProperty(global, 'WebSocket', {
      configurable: true,
      writable: true,
      value: websocketMock,
    });
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    sockets.length = 0;
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    localStorage.clear();
    Object.defineProperty(global, 'WebSocket', {
      configurable: true,
      writable: true,
      value: originalWebSocket,
    });
  });

  it('emits events and filters by type through on and onAny', () => {
    installWebSocketMock();
    const service = TestBed.inject(PlatformSyncService);
    const event: PlatformEvent = {
      type: 'booking-confirmed',
      payload: { id: 1 },
      timestamp: new Date().toISOString(),
      source: 'admin',
    };
    const matching = jest.fn();
    const anyMatching = jest.fn();

    service.on('booking-confirmed').subscribe(matching);
    service.onAny('booking-created', 'booking-confirmed').subscribe(anyMatching);

    service.emit(event);

    expect(service.lastEvent()).toEqual(event);
    expect(matching).toHaveBeenCalledWith(event);
    expect(anyMatching).toHaveBeenCalledWith(event);
  });

  it('connects with the stored token, stops polling on open, and handles socket messages', () => {
    localStorage.setItem('access_token', 'abc 123');
    installWebSocketMock();
    const service = TestBed.inject(PlatformSyncService);
    const pollingSubscription = { unsubscribe: jest.fn() };
    (service as unknown as { pollingSubscription: { unsubscribe: jest.Mock } | null }).pollingSubscription = pollingSubscription;
    (service as unknown as { reconnectAttempts: number }).reconnectAttempts = 3;

    service.connect();

    expect(sockets).toHaveLength(1);
    expect(sockets[0].url).toBe('ws://localhost:8000/ws/events');
    expect(sockets[0].protocols).toEqual(['access_token', 'abc 123']);

    sockets[0].onopen?.();
    expect(service.connected()).toBe(true);
    expect((service as unknown as { reconnectAttempts: number }).reconnectAttempts).toBe(0);
    expect(pollingSubscription.unsubscribe).toHaveBeenCalled();

    sockets[0].onmessage?.({
      data: JSON.stringify({
        type: 'inventory-updated',
        payload: { room_id: 9 },
        timestamp: '2026-04-08T10:00:00Z',
        source: 'system',
      }),
    } as MessageEvent);

    expect(service.lastEvent()?.type).toBe('inventory-updated');

    sockets[0].onmessage?.({ data: '{bad-json' } as MessageEvent);
    expect(service.lastEvent()?.type).toBe('inventory-updated');
  });

  it('schedules reconnects on close and falls back to polling after max attempts', () => {
    installWebSocketMock();
    const service = TestBed.inject(PlatformSyncService);
    (service as unknown as { maxReconnectAttempts: number }).maxReconnectAttempts = 1;

    service.connect();
    sockets[0].onclose?.();
    expect(service.connected()).toBe(false);

    jest.advanceTimersByTime(2000);
    expect(sockets).toHaveLength(2);

    sockets[1].onclose?.();
    jest.advanceTimersByTime(15000);

    expect(service.lastEvent()?.type).toBe('room-updated');
    expect(service.lastEvent()?.payload).toEqual({ action: 'poll-refresh' });
  });

  it('starts polling fallback on websocket error and when websocket construction throws', () => {
    installWebSocketMock((url, protocols) => {
      const socket: MockSocket = {
        url,
        protocols: protocols || [],
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null,
        close: jest.fn(function (this: MockSocket) {
          this.onclose?.();
        }),
      };
      return socket;
    });
    const service = TestBed.inject(PlatformSyncService);
    (service as unknown as { maxReconnectAttempts: number }).maxReconnectAttempts = 0;

    service.connect();
    sockets[0].onerror?.();

    expect(sockets[0].close).toHaveBeenCalled();
    jest.advanceTimersByTime(15000);
    expect(service.lastEvent()?.type).toBe('room-updated');

    sockets.length = 0;
    Object.defineProperty(global, 'WebSocket', {
      configurable: true,
      writable: true,
      value: jest.fn(() => {
        throw new Error('no websocket');
      }),
    });

    const secondService = TestBed.inject(PlatformSyncService);
    secondService.connect();
    jest.advanceTimersByTime(15000);
    expect(secondService.lastEvent()?.type).toBe('room-updated');
  });

  it('cleans up websocket and polling subscriptions on destroy', () => {
    installWebSocketMock();
    const service = TestBed.inject(PlatformSyncService);
    service.connect();
    const socket = sockets[0];

    (service as unknown as { pollingSubscription: { unsubscribe: jest.Mock } | null }).pollingSubscription = {
      unsubscribe: jest.fn(),
    };

    service.ngOnDestroy();

    expect(socket.close).toHaveBeenCalled();
    expect(
      (service as unknown as { pollingSubscription: { unsubscribe: jest.Mock } | null }).pollingSubscription,
    ).toBeNull();
  });
});

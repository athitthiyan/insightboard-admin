import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, OnDestroy, Output, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface AdminNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="admin-header">
      <div class="admin-header__left">
        <button
          class="admin-header__menu"
          type="button"
          (click)="menuToggle.emit()"
          aria-label="Open navigation"
        >
          ☰
        </button>

        <div class="admin-header__greeting">
          <h2>Good {{ timeOfDay() }}, Admin</h2>
          <p>{{ today() }} · Hotel Management Overview</p>
        </div>
      </div>

      <div class="admin-header__right">
        <div class="admin-header__search">
          <span>⌕</span>
          <input type="text" placeholder="Search bookings, guests..." aria-label="Search bookings and guests" />
        </div>

        <button class="admin-header__notif" type="button" (click)="toggleNotifications()" aria-label="Toggle notifications">
          <span>🔔</span>
          @if (unreadCount() > 0) {
            <span class="admin-header__badge">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
          }
        </button>

        @if (notifOpen()) {
          <div class="notif-panel">
            <div class="notif-panel__head">
              <strong>Notifications</strong>
              @if (unreadCount() > 0) {
                <button type="button" class="notif-panel__mark-all" (click)="markAllRead()">Mark all read</button>
              }
            </div>
            <div class="notif-panel__list">
              @for (n of notifications(); track n.id) {
                <button type="button" class="notif-item" [class.notif-item--unread]="!n.read" (click)="markRead(n)">
                  <div class="notif-item__icon">{{ getNotifIcon(n.type) }}</div>
                  <div class="notif-item__body">
                    <strong>{{ n.title }}</strong>
                    <p>{{ n.message }}</p>
                    <small>{{ formatTimeAgo(n.created_at) }}</small>
                  </div>
                </button>
              } @empty {
                <div class="notif-panel__empty">{{ notificationError() || 'No notifications yet' }}</div>
              }
            </div>
          </div>
        }

        <div class="admin-header__user">
          <div class="admin-header__avatar">{{ initials() }}</div>
          <div>
            <strong>{{ displayName() }}</strong>
            <span>{{ roleLabel() }}</span>
          </div>
        </div>

        <button class="admin-header__logout" type="button" (click)="logout()">Logout</button>
      </div>
    </header>
  `,
  styles: [`
    .admin-header {
      min-height: 64px;
      background: var(--sv-bg-2);
      border-bottom: 1px solid var(--sv-border);
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 50;
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .admin-header__left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .admin-header__menu {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: 1px solid var(--sv-border);
      background: var(--sv-surface);
      color: var(--sv-text);
      font-size: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .admin-header__greeting {
      min-width: 0;
    }

    .admin-header__greeting h2 {
      font-size: 15px;
      font-weight: 600;
      color: var(--sv-text);
    }

    .admin-header__greeting p {
      font-size: 12px;
      color: var(--sv-text-muted);
      margin-top: 2px;
    }

    .admin-header__right {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: auto;
      width: 100%;
      justify-content: space-between;
    }

    .admin-header__search {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--sv-surface);
      border: 1px solid var(--sv-border);
      border-radius: 8px;
      padding: 8px 14px;
      flex: 1;
      min-width: 0;
      transition: all 0.2s;
    }

    .admin-header__search:focus-within {
      border-color: var(--sv-gold);
      box-shadow: 0 0 0 3px rgba(214, 184, 107, 0.1);
    }

    .admin-header__search span {
      font-size: 14px;
      flex-shrink: 0;
    }

    .admin-header__search input {
      background: none;
      border: none;
      outline: none;
      color: var(--sv-text);
      font-size: 13px;
      width: 100%;
    }

    .admin-header__search input::placeholder {
      color: var(--sv-text-subtle);
    }

    .admin-header__notif {
      position: relative;
      cursor: pointer;
      font-size: 18px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--sv-surface);
      border: 1px solid var(--sv-border);
      border-radius: 8px;
      transition: all 0.2s;
      padding: 0;
    }

    .admin-header__notif:hover {
      border-color: var(--sv-border-2);
    }

    .admin-header__badge {
      position: absolute !important;
      top: -4px;
      right: -4px;
      font-size: 9px !important;
      font-weight: 700;
      background: #ef4444;
      color: white;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex !important;
      align-items: center;
      justify-content: center;
    }

    /* ── Notification Panel ── */
    .notif-panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 80px;
      width: 380px;
      max-height: 460px;
      background: var(--sv-bg-2, #0d1321);
      border: 1px solid var(--sv-border, rgba(255,255,255,0.08));
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 200;
      overflow: hidden;
      animation: notifSlideIn 0.2s ease;
    }
    @keyframes notifSlideIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: none; }
    }
    .notif-panel__head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid var(--sv-border, rgba(255,255,255,0.08));
    }
    .notif-panel__head strong { font-size: 14px; color: var(--sv-text, #f0f4ff); }
    .notif-panel__mark-all {
      border: none; background: none; color: var(--sv-gold, #d6b86b);
      font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .notif-panel__list {
      max-height: 380px; overflow-y: auto;
    }
    .notif-item {
      display: flex; gap: 12px; padding: 12px 16px;
      border-bottom: 1px solid var(--sv-border, rgba(255,255,255,0.04));
      cursor: pointer; transition: background 0.15s;
      width: 100%;
      text-align: left;
      background: transparent;
      border: none;
    }
    .notif-item:hover { background: rgba(255,255,255,0.03); }
    .notif-item--unread { background: rgba(214, 184, 107, 0.04); }
    .notif-item__icon { font-size: 1.2rem; flex-shrink: 0; margin-top: 2px; }
    .notif-item__body { flex: 1; min-width: 0; }
    .notif-item__body strong { display: block; font-size: 13px; color: var(--sv-text, #f0f4ff); }
    .notif-item__body p { font-size: 12px; color: var(--sv-text-muted, #8a9bbf); margin: 2px 0 4px; }
    .notif-item__body small { font-size: 11px; color: var(--sv-text-subtle, #5a6d8a); }
    .notif-panel__empty {
      padding: 40px 16px; text-align: center;
      color: var(--sv-text-muted, #8a9bbf); font-size: 13px;
    }

    .admin-header__user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 12px 6px 6px;
      background: var(--sv-surface);
      border: 1px solid var(--sv-border);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 0;
    }

    .admin-header__user:hover {
      border-color: var(--sv-border-2);
    }

    .admin-header__user strong {
      display: block;
      font-size: 13px;
      color: var(--sv-text);
      font-weight: 600;
    }

    .admin-header__user span {
      font-size: 11px;
      color: var(--sv-text-muted);
    }

    .admin-header__avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--sv-gradient-gold);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: #0a0f1e;
      flex-shrink: 0;
    }

    .admin-header__logout {
      border: 1px solid var(--sv-border);
      background: var(--sv-surface);
      color: var(--sv-text);
      border-radius: 8px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    }

    @media (max-width: 640px) {
      .admin-header__greeting p,
      .admin-header__user div:last-child,
      .admin-header__logout {
        display: none;
      }

      .admin-header__notif,
      .admin-header__user {
        flex-shrink: 0;
      }
    }

    @media (min-width: 769px) {
      .admin-header {
        padding: 0 32px;
        gap: 16px;
        flex-wrap: nowrap;
      }

      .admin-header__menu {
        display: none;
      }

      .admin-header__right {
        width: auto;
        gap: 16px;
        justify-content: flex-end;
      }

      .admin-header__search {
        width: 240px;
        flex: 0 0 240px;
      }
    }
  `],
})
export class HeaderComponent implements OnDestroy {
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  @Output() menuToggle = new EventEmitter<void>();

  timeOfDay = signal('');
  today = signal('');
  notifOpen = signal(false);
  notifications = signal<AdminNotification[]>([]);
  notificationError = signal('');
  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  displayName = computed(() => this.auth.user()?.full_name || 'Admin');
  roleLabel = computed(() => (this.auth.user()?.is_admin ? 'Administrator' : 'Team'));
  initials = computed(() =>
    (this.auth.user()?.full_name || 'Admin')
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  );

  private pollInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const h = new Date().getHours();
    this.timeOfDay.set(h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening');
    this.today.set(
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    );
    this.loadNotifications();
    // Poll every 30s for new notifications
    this.pollInterval = setInterval(() => this.loadNotifications(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.notifOpen() && !target.closest('.notif-panel') && !target.closest('.admin-header__notif')) {
      this.notifOpen.set(false);
    }
  }

  toggleNotifications(): void {
    this.notifOpen.update(v => !v);
    if (this.notifOpen()) this.loadNotifications();
  }

  loadNotifications(): void {
    this.http.get<{ notifications: AdminNotification[] }>(`${environment.apiUrl}/notifications`).subscribe({
      next: (res) => {
        this.notificationError.set('');
        this.notifications.set(res.notifications || []);
      },
      error: () => {
        this.notificationError.set('Notifications are temporarily unavailable.');
      },
    });
  }

  markRead(n: AdminNotification): void {
    if (n.read) return;
    n.read = true;
    this.notifications.update(list => [...list]);
    this.http.patch(`${environment.apiUrl}/notifications/${n.id}/read`, {}).subscribe({ error: () => {} });
  }

  markAllRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.http.patch(`${environment.apiUrl}/notifications/read-all`, {}).subscribe({ error: () => {} });
  }

  getNotifIcon(type: string): string {
    const map: Record<string, string> = {
      booking: '\u2611',
      payment: '\u20B9',
      refund: '\u21A9',
      partner: '\u2616',
      system: '\u2699',
      cancellation: '\u2715',
    };
    return map[type] || '\u2139';
  }

  formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  logout() {
    this.auth.logout();
  }
}



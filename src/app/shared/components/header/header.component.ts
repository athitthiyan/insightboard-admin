import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

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

        <div class="admin-header__notif">
          <span>◌</span>
          <span class="admin-header__badge">3</span>
        </div>

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
      background: var(--ib-bg-2);
      border-bottom: 1px solid var(--ib-border);
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
      border: 1px solid var(--ib-border);
      background: var(--ib-surface);
      color: var(--ib-text);
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
      color: var(--ib-text);
    }

    .admin-header__greeting p {
      font-size: 12px;
      color: var(--ib-text-muted);
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
      background: var(--ib-surface);
      border: 1px solid var(--ib-border);
      border-radius: 8px;
      padding: 8px 14px;
      flex: 1;
      min-width: 0;
      transition: all 0.2s;
    }

    .admin-header__search:focus-within {
      border-color: var(--ib-primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .admin-header__search span {
      font-size: 14px;
      flex-shrink: 0;
    }

    .admin-header__search input {
      background: none;
      border: none;
      outline: none;
      color: var(--ib-text);
      font-size: 13px;
      width: 100%;
    }

    .admin-header__search input::placeholder {
      color: var(--ib-text-subtle);
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
      background: var(--ib-surface);
      border: 1px solid var(--ib-border);
      border-radius: 8px;
      transition: all 0.2s;
    }

    .admin-header__notif:hover {
      border-color: var(--ib-border-2);
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

    .admin-header__user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 12px 6px 6px;
      background: var(--ib-surface);
      border: 1px solid var(--ib-border);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 0;
    }

    .admin-header__user:hover {
      border-color: var(--ib-border-2);
    }

    .admin-header__user strong {
      display: block;
      font-size: 13px;
      color: var(--ib-text);
      font-weight: 600;
    }

    .admin-header__user span {
      font-size: 11px;
      color: var(--ib-text-muted);
    }

    .admin-header__avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, var(--ib-primary), var(--ib-primary-dark));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .admin-header__logout {
      border: 1px solid var(--ib-border);
      background: var(--ib-surface);
      color: var(--ib-text);
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
export class HeaderComponent {
  private auth = inject(AuthService);

  @Output() menuToggle = new EventEmitter<void>();

  timeOfDay = signal('');
  today = signal('');
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
  }

  logout() {
    this.auth.logout();
  }
}

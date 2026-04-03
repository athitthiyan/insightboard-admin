import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="admin-header">
      <div class="admin-header__left">
        <div class="admin-header__greeting">
          <h2>Good {{ timeOfDay() }}, Admin 👋</h2>
          <p>{{ today() }} — Hotel Management Overview</p>
        </div>
      </div>
      <div class="admin-header__right">
        <div class="admin-header__search">
          <span>🔍</span>
          <input type="text" placeholder="Search bookings, guests..." />
        </div>
        <div class="admin-header__notif">
          <span>🔔</span>
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
      height: 64px;
      background: var(--ib-bg-2);
      border-bottom: 1px solid var(--ib-border);
      padding: 0 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      position: sticky;
      top: 0;
      z-index: 50;
      flex-shrink: 0;
    }

    .admin-header__greeting h2 { font-size: 15px; font-weight: 600; color: var(--ib-text); }
    .admin-header__greeting p { font-size: 12px; color: var(--ib-text-muted); margin-top: 2px; }

    .admin-header__right {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-left: auto;
    }

    .admin-header__search {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--ib-surface);
      border: 1px solid var(--ib-border);
      border-radius: 8px;
      padding: 8px 14px;
      width: 240px;
      transition: all 0.2s;
    }

    .admin-header__search:focus-within {
      border-color: var(--ib-primary);
      box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    }

    .admin-header__search span { font-size: 14px; flex-shrink: 0; }

    .admin-header__search input {
      background: none;
      border: none;
      outline: none;
      color: var(--ib-text);
      font-size: 13px;
      width: 100%;
    }

    .admin-header__search input::placeholder { color: var(--ib-text-subtle); }

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

    .admin-header__notif:hover { border-color: var(--ib-border-2); }

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
      padding: 6px 14px 6px 6px;
      background: var(--ib-surface);
      border: 1px solid var(--ib-border);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .admin-header__user:hover { border-color: var(--ib-border-2); }
    .admin-header__user strong { display: block; font-size: 13px; color: var(--ib-text); font-weight: 600; }
    .admin-header__user span { font-size: 11px; color: var(--ib-text-muted); }

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

    @media (max-width: 768px) {
      .admin-header__search { display: none; }
      .admin-header__logout { display: none; }
    }
  `],
})
export class HeaderComponent {
  private auth = inject(AuthService);

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
    this.today.set(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }

  logout() {
    this.auth.logout();
  }
}

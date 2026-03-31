import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

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
          <div class="admin-header__avatar">A</div>
          <div>
            <strong>Athitthiyan</strong>
            <span>Admin</span>
          </div>
        </div>
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

      &__greeting {
        h2 { font-size: 15px; font-weight: 600; color: var(--ib-text); }
        p  { font-size: 12px; color: var(--ib-text-muted); margin-top: 2px; }
      }

      &__right {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-left: auto;
      }

      &__search {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--ib-surface);
        border: 1px solid var(--ib-border);
        border-radius: 8px;
        padding: 8px 14px;
        width: 240px;
        transition: all 0.2s;

        &:focus-within {
          border-color: var(--ib-primary);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        span { font-size: 14px; flex-shrink: 0; }

        input {
          background: none;
          border: none;
          outline: none;
          color: var(--ib-text);
          font-size: 13px;
          width: 100%;
          &::placeholder { color: var(--ib-text-subtle); }
        }

        @media (max-width: 768px) { display: none; }
      }

      &__notif {
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
        &:hover { border-color: var(--ib-border-2); }
      }

      &__badge {
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

      &__user {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 14px 6px 6px;
        background: var(--ib-surface);
        border: 1px solid var(--ib-border);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
        &:hover { border-color: var(--ib-border-2); }

        strong { display: block; font-size: 13px; color: var(--ib-text); font-weight: 600; }
        span   { font-size: 11px; color: var(--ib-text-muted); }
      }

      &__avatar {
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
    }
  `],
})
export class HeaderComponent {
  timeOfDay = signal('');
  today = signal('');

  constructor() {
    const h = new Date().getHours();
    this.timeOfDay.set(h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening');
    this.today.set(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }
}

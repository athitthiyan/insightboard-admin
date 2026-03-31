import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <!-- Logo -->
      <div class="sidebar__logo">
        <span class="sidebar__logo-icon">📊</span>
        @if (!collapsed()) {
          <span class="sidebar__logo-text">Insight<span>Board</span></span>
        }
        <button class="sidebar__toggle" (click)="collapsed.update(v => !v)">
          {{ collapsed() ? '→' : '←' }}
        </button>
      </div>

      <!-- Nav -->
      <nav class="sidebar__nav">
        <div class="sidebar__section-label">@if (!collapsed()) { Main }</div>
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{exact: item.route === '/'}"
            class="sidebar__nav-item"
            [title]="collapsed() ? item.label : ''"
          >
            <span class="sidebar__nav-icon">{{ item.icon }}</span>
            @if (!collapsed()) { <span>{{ item.label }}</span> }
          </a>
        }

        <div class="sidebar__divider"></div>
        <div class="sidebar__section-label">@if (!collapsed()) { Portfolio }</div>

        @for (link of portfolioLinks; track link.label) {
          <a [href]="link.url" target="_blank" class="sidebar__nav-item sidebar__nav-item--ext" [title]="collapsed() ? link.label : ''">
            <span class="sidebar__nav-icon">{{ link.icon }}</span>
            @if (!collapsed()) { <span>{{ link.label }} ↗</span> }
          </a>
        }
      </nav>

      <!-- Footer -->
      @if (!collapsed()) {
        <div class="sidebar__footer">
          <div class="sidebar__status">
            <span class="sidebar__status-dot"></span>
            <span>API Connected</span>
          </div>
          <p>Built by Athitthiyan</p>
        </div>
      }
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      min-height: 100vh;
      background: var(--ib-sidebar);
      border-right: 1px solid var(--ib-border);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      transition: width 0.3s ease;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: hidden;

      &.collapsed { width: 72px; }

      &__logo {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 20px 16px;
        border-bottom: 1px solid var(--ib-border);
        min-height: 64px;

        &-icon { font-size: 1.6rem; flex-shrink: 0; }
        &-text {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--ib-text);
          white-space: nowrap;
          flex: 1;
          span { color: var(--ib-primary-light); }
        }
      }

      &__toggle {
        background: var(--ib-surface);
        border: 1px solid var(--ib-border);
        border-radius: 6px;
        color: var(--ib-text-muted);
        width: 24px;
        height: 24px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.2s;
        &:hover { border-color: var(--ib-primary); color: var(--ib-primary-light); }
      }

      &__nav {
        flex: 1;
        padding: 16px 8px;
        overflow-y: auto;
        overflow-x: hidden;
      }

      &__section-label {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: var(--ib-text-subtle);
        padding: 8px 10px 6px;
        height: 32px;
        display: flex;
        align-items: center;
      }

      &__nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 10px;
        color: var(--ib-text-muted);
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
        margin-bottom: 2px;
        white-space: nowrap;

        &:hover {
          background: var(--ib-surface-2);
          color: var(--ib-text);
        }

        &.active {
          background: rgba(99,102,241,0.12);
          color: var(--ib-primary-light);
          border: 1px solid rgba(99,102,241,0.2);
        }

        &--ext {
          color: var(--ib-text-subtle);
          font-size: 13px;
          &:hover { color: var(--ib-accent); }
        }
      }

      &__nav-icon {
        font-size: 18px;
        flex-shrink: 0;
        width: 24px;
        text-align: center;
      }

      &__divider {
        height: 1px;
        background: var(--ib-border);
        margin: 12px 8px;
      }

      &__footer {
        padding: 16px;
        border-top: 1px solid var(--ib-border);
      }

      &__status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--ib-text-muted);
        margin-bottom: 8px;
      }

      &__status-dot {
        width: 7px;
        height: 7px;
        background: #22c55e;
        border-radius: 50%;
        animation: pulse 2s ease infinite;
        box-shadow: 0 0 6px rgba(34,197,94,0.6);
      }

      p {
        font-size: 11px;
        color: var(--ib-text-subtle);
      }

      @media (max-width: 768px) {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 200;
        &.collapsed { width: 0; padding: 0; border: none; }
      }
    }
  `],
})
export class SidebarComponent {
  collapsed = signal(false);

  navItems: NavItem[] = [
    { icon: '📊', label: 'Overview',     route: '/' },
    { icon: '📅', label: 'Bookings',     route: '/bookings' },
    { icon: '💳', label: 'Transactions', route: '/transactions' },
  ];

  portfolioLinks = [
    { icon: '🏨', label: 'StayEase',  url: environment.bookingAppUrl },
    { icon: '💸', label: 'PayFlow',   url: environment.paymentAppUrl },
  ];
}

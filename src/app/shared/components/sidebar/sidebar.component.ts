import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
    <aside
      class="sidebar"
      [class.collapsed]="collapsed()"
      [class.sidebar--mobile-open]="mobileOpen"
      aria-label="Admin navigation"
    >
      <div class="sidebar__logo">
        <span class="sidebar__logo-icon">AI</span>
        @if (!collapsed()) {
          <span class="sidebar__logo-text">Insight<span>Board</span></span>
        }

        <button
          class="sidebar__toggle sidebar__toggle--desktop"
          type="button"
          (click)="toggleCollapsed()"
          [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          {{ collapsed() ? '>' : '<' }}
        </button>

        <button
          class="sidebar__toggle sidebar__toggle--mobile"
          type="button"
          (click)="requestClose.emit()"
          aria-label="Close sidebar"
        >
          ×
        </button>
      </div>

      <nav class="sidebar__nav">
        <div class="sidebar__section-label">@if (!collapsed()) { Main }</div>
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.route === '/' }"
            class="sidebar__nav-item"
            [title]="collapsed() ? item.label : ''"
            (click)="handleNavClick()"
          >
            <span class="sidebar__nav-icon">{{ item.icon }}</span>
            @if (!collapsed()) { <span>{{ item.label }}</span> }
          </a>
        }

        <div class="sidebar__divider"></div>
        <div class="sidebar__section-label">@if (!collapsed()) { Channels }</div>

        @for (link of portfolioLinks; track link.label) {
          <a
            [href]="link.url"
            target="_blank"
            rel="noreferrer"
            class="sidebar__nav-item sidebar__nav-item--ext"
            [title]="collapsed() ? link.label : ''"
            (click)="handleNavClick()"
          >
            <span class="sidebar__nav-icon">{{ link.icon }}</span>
            @if (!collapsed()) { <span>{{ link.label }} -></span> }
          </a>
        }
      </nav>

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
      width: min(84vw, 320px);
      min-height: 100dvh;
      background: var(--ib-sidebar);
      border-right: 1px solid var(--ib-border);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      transition: transform 0.25s ease, width 0.25s ease;
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      height: 100dvh;
      overflow: hidden;
      z-index: 140;
      transform: translateX(-100%);
    }

    .sidebar.sidebar--mobile-open {
      transform: translateX(0);
    }

    .sidebar.collapsed {
      width: 72px;
    }

    .sidebar__logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px;
      border-bottom: 1px solid var(--ib-border);
      min-height: 64px;
    }

    .sidebar__logo-icon {
      font-size: 1rem;
      font-weight: 700;
      flex-shrink: 0;
      color: var(--ib-primary-light);
    }

    .sidebar__logo-text {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--ib-text);
      white-space: nowrap;
      flex: 1;
    }

    .sidebar__logo-text span {
      color: var(--ib-primary-light);
    }

    .sidebar__toggle {
      background: var(--ib-surface);
      border: 1px solid var(--ib-border);
      border-radius: 6px;
      color: var(--ib-text-muted);
      width: 28px;
      height: 28px;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .sidebar__toggle--mobile {
      margin-left: auto;
      font-size: 18px;
      display: inline-flex;
    }

    .sidebar__toggle--desktop {
      display: none;
    }

    .sidebar__toggle:hover {
      border-color: var(--ib-primary);
      color: var(--ib-primary-light);
    }

    .sidebar__nav {
      flex: 1;
      padding: 16px 8px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .sidebar__section-label {
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

    .sidebar__nav-item {
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
    }

    .sidebar__nav-item:hover {
      background: var(--ib-surface-2);
      color: var(--ib-text);
    }

    .sidebar__nav-item.active {
      background: rgba(99, 102, 241, 0.12);
      color: var(--ib-primary-light);
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    .sidebar__nav-item--ext {
      color: var(--ib-text-subtle);
      font-size: 13px;
    }

    .sidebar__nav-item--ext:hover {
      color: var(--ib-accent);
    }

    .sidebar__nav-icon {
      font-size: 18px;
      flex-shrink: 0;
      width: 24px;
      text-align: center;
    }

    .sidebar__divider {
      height: 1px;
      background: var(--ib-border);
      margin: 12px 8px;
    }

    .sidebar__footer {
      padding: 16px;
      border-top: 1px solid var(--ib-border);
    }

    .sidebar__status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--ib-text-muted);
      margin-bottom: 8px;
    }

    .sidebar__status-dot {
      width: 7px;
      height: 7px;
      background: #22c55e;
      border-radius: 50%;
      animation: pulse 2s ease infinite;
      box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
    }

    .sidebar p {
      font-size: 11px;
      color: var(--ib-text-subtle);
    }

    @media (max-width: 768px) {
      .sidebar.collapsed {
        width: min(84vw, 320px);
      }
    }

    @media (min-width: 769px) {
      .sidebar {
        width: var(--sidebar-width);
        min-height: 100vh;
        position: sticky;
        height: 100vh;
        transform: none;
        z-index: auto;
      }

      .sidebar__toggle--desktop {
        display: inline-flex;
      }

      .sidebar__toggle--mobile {
        display: none;
      }
    }
  `],
})
export class SidebarComponent {
  @Input() mobileOpen = false;
  @Output() requestClose = new EventEmitter<void>();

  collapsed = signal(false);

  navItems: NavItem[] = [
    { icon: 'O', label: 'Overview', route: '/' },
    { icon: 'B', label: 'Bookings', route: '/bookings' },
    { icon: 'T', label: 'Transactions', route: '/transactions' },
  ];

  portfolioLinks = [
    { icon: 'S', label: 'Stayvora', url: environment.bookingAppUrl },
    { icon: 'P', label: 'PayFlow', url: environment.paymentAppUrl },
  ];

  toggleCollapsed() {
    this.collapsed.update(value => !value);
  }

  handleNavClick() {
    this.requestClose.emit();
  }
}

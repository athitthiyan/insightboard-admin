import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    @if (showAdminShell()) {
      <div class="admin-layout">
        <button
          type="button"
          class="admin-layout__overlay"
          [class.admin-layout__overlay--visible]="sidebarOpen()"
          (click)="closeSidebar()"
          aria-label="Close navigation"
        ></button>

        <app-sidebar
          [mobileOpen]="sidebarOpen()"
          (requestClose)="closeSidebar()"
        />

        <div class="admin-layout__main">
          <app-header (menuToggle)="toggleSidebar()" />
          <main class="admin-layout__content">
            <router-outlet />
          </main>
        </div>
      </div>
    } @else {
      <router-outlet />
    }
  `,
  styles: [`
    .admin-layout {
      min-height: 100vh;
      background: var(--ib-bg);
      display: flex;
      position: relative;
    }

    .admin-layout__main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    .admin-layout__content {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }

    .admin-layout__overlay {
      position: fixed;
      inset: 0;
      border: 0;
      background: rgba(3, 7, 18, 0.72);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      z-index: 139;
    }

    .admin-layout__overlay--visible {
      opacity: 1;
      pointer-events: auto;
    }

    @media (min-width: 769px) {
      .admin-layout__content {
        padding: 32px;
      }

      .admin-layout__overlay {
        display: none;
      }
    }
  `],
})
export class AppComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  private currentUrl = signal(this.router.url);

  sidebarOpen = signal(false);
  showAdminShell = computed(() => this.currentUrl() !== '/login' && this.auth.isAuthenticated());

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUrl.set(this.router.url);
        this.closeSidebar();
      });

    this.auth.restoreSession()?.subscribe({
      error: () => this.auth.logout(false),
    });
  }

  toggleSidebar() {
    this.sidebarOpen.update(value => !value);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }
}

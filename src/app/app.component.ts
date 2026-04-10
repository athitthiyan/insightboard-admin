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
    @if (isAuthReady()) {
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
    }
  `,
  styles: [`
    .admin-layout {
      min-height: 100vh;
      background: var(--sv-bg);
      display: grid;
      grid-template-columns: 1fr;
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
      width: 100%;
      max-width: var(--sv-layout-max);
      margin-inline: auto;
      padding: var(--sv-space-md);
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

    @media (min-width: 768px) {
      .admin-layout__content {
        padding: var(--sv-space-lg);
      }
    }

    @media (min-width: 1024px) {
      .admin-layout {
        grid-template-columns: auto minmax(0, 1fr);
      }

      .admin-layout__content {
        padding: var(--sv-space-xl);
      }
    }

    @media (min-width: 1440px) {
      .admin-layout__content {
        padding: var(--sv-space-2xl);
      }
    }

    @media (min-width: 768px) {
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
  isAuthReady = signal(false);
  showAdminShell = computed(() => this.currentUrl() !== '/login' && this.auth.isAuthenticated());

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUrl.set(this.router.url);
        this.closeSidebar();
      });

    // Restore session with proper race condition handling
    const restoreObs = this.auth.restoreSession();
    if (restoreObs) {
      restoreObs.subscribe({
        complete: () => this.isAuthReady.set(true),
        error: () => {
          this.auth.logout(false);
          this.isAuthReady.set(true);
        },
      });
    } else {
      // No restoration needed, ready immediately
      this.isAuthReady.set(true);
    }
  }

  toggleSidebar() {
    this.sidebarOpen.update(value => !value);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    @if (showAdminShell()) {
      <div class="admin-layout">
        <app-sidebar />
        <div class="admin-layout__main">
          <app-header />
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
      display: flex;
      min-height: 100vh;
      background: var(--ib-bg);
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
      padding: 32px;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .admin-layout__content { padding: 20px 16px; }
    }
  `],
})
export class AppComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  private currentUrl = signal(this.router.url);

  showAdminShell = computed(() => this.currentUrl() !== '/login' && this.auth.isAuthenticated());

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.currentUrl.set(this.router.url));

    this.auth.restoreSession()?.subscribe({
      error: () => this.auth.logout(false),
    });
  }
}

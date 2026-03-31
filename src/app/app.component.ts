import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { HeaderComponent } from './shared/components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="admin-layout">
      <app-sidebar />
      <div class="admin-layout__main">
        <app-header />
        <main class="admin-layout__content">
          <router-outlet />
        </main>
      </div>
    </div>
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
export class AppComponent {}

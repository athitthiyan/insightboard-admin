import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-card__eyebrow">Stayvora Admin</div>
        <h1>Secure <span>Admin Access</span></h1>
        <p>Sign in with your admin account to manage bookings, analytics, and payments.</p>

        <form class="login-form" (ngSubmit)="login()">
          <label class="login-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              [(ngModel)]="email"
              placeholder="ops@stayvora.co.in"
              [disabled]="loading()"
              required
            />
          </label>

          <label class="login-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              [(ngModel)]="password"
              placeholder="Enter your password"
              [disabled]="loading()"
              required
            />
          </label>

          @if (error()) {
            <div class="login-error">{{ error() }}</div>
          }

          <button class="login-submit" type="submit" [disabled]="loading()">
            @if (loading()) {
              <span>Signing in...</span>
            } @else {
              <span>Continue to Dashboard</span>
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background:
        radial-gradient(circle at top left, rgba(214, 184, 107, 0.12), transparent 28%),
        radial-gradient(circle at bottom right, rgba(99, 199, 212, 0.14), transparent 32%),
        linear-gradient(160deg, #071119 0%, #0b1622 55%, #091320 100%);
    }

    .login-card {
      width: 100%;
      max-width: 460px;
      padding: 36px;
      border-radius: 24px;
      border: 1px solid rgba(214, 184, 107, 0.15);
      background: rgba(7, 17, 25, 0.92);
      box-shadow: 0 30px 80px rgba(7, 17, 25, 0.45);
      color: #f0f4ff;
    }

    .login-card__eyebrow {
      display: inline-block;
      margin-bottom: 14px;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(214, 184, 107, 0.12);
      color: #f0d58f;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .login-card h1 {
      margin: 0 0 8px;
      font-size: 2.2rem;
      line-height: 1.05;
      color: #f0f4ff;
    }

    .login-card h1 span { color: #f0d58f; }
    .login-card p { margin: 0 0 24px; color: #8a9bbf; line-height: 1.6; }

    .login-form { display: grid; gap: 16px; }

    .login-field {
      display: grid;
      gap: 8px;
      font-size: 13px;
      color: #d0d8e8;
    }

    .login-field input {
      width: 100%;
      border: 1px solid rgba(214, 184, 107, 0.2);
      border-radius: 14px;
      background: rgba(7, 17, 25, 0.78);
      color: #f0f4ff;
      padding: 14px 16px;
      outline: none;
    }

    .login-field input:focus {
      border-color: #d6b86b;
      box-shadow: 0 0 0 3px rgba(214, 184, 107, 0.16);
    }

    .login-error {
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(239, 68, 68, 0.14);
      border: 1px solid rgba(239, 68, 68, 0.18);
      color: #fecaca;
      font-size: 13px;
    }

    .login-submit {
      border: none;
      border-radius: 14px;
      padding: 14px 16px;
      background: linear-gradient(135deg, #d6b86b, #f0d58f);
      color: #0a0f1e;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
    }

    .login-submit:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  login() {
    if (!this.email || !this.password) {
      this.error.set('Email and password are required.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: response => {
        if (!response.user.is_admin) {
          this.auth.logout(false);
          this.error.set('This account does not have admin access.');
          this.loading.set(false);
          return;
        }
        this.router.navigate(['/']);
      },
      error: err => {
        this.error.set(err?.error?.detail || 'Unable to sign in right now.');
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }
}

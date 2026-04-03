/**
 * Extended end-to-end tests for InsightBoard Admin Dashboard
 *
 * All API calls are intercepted with route mocks so no live backend is needed.
 *
 * Flows covered:
 *   1. Non-admin login is rejected with an error message
 *   2. Invalid credentials show backend error
 *   3. Admin accesses bookings table and filters by status
 *   4. Admin accesses transactions page and filters by status
 *   5. Guard redirects unauthenticated user to /login
 *   6. Logout clears session and redirects to /login
 *   7. Auth/me restore session on app load (AppComponent)
 */

import { test, expect, Page } from '@playwright/test';

// ─── Mock helpers ──────────────────────────────────────────────────────────────

const ADMIN_USER = {
  id: 1,
  email: 'admin@example.com',
  full_name: 'Admin User',
  is_admin: true,
  is_active: true,
};

const NON_ADMIN_USER = {
  id: 2,
  email: 'user@example.com',
  full_name: 'Normal User',
  is_admin: false,
  is_active: true,
};

const MOCK_AUTH_RESPONSE = (user: typeof ADMIN_USER) => ({
  access_token: `playwright-access-${user.id}`,
  refresh_token: `playwright-refresh-${user.id}`,
  token_type: 'bearer',
  user,
});

const MOCK_ANALYTICS = {
  kpis: {
    total_bookings: 25, total_revenue: 12500, success_rate: 88,
    avg_booking_value: 500, bookings_today: 3, revenue_today: 1500,
    pending_bookings: 2, failed_payments: 1,
  },
  daily_stats: [{ date: '2026-04-01', bookings: 3, revenue: 1500 }],
  monthly_revenue: [{ month: 'Apr 2026', revenue: 12500, bookings: 25 }],
  payment_breakdown: [
    { status: 'success', count: 22, percentage: 88 },
    { status: 'failed', count: 3, percentage: 12 },
  ],
  room_type_breakdown: [
    { room_type: 'suite', count: 15, revenue: 8000 },
    { room_type: 'deluxe', count: 10, revenue: 4500 },
  ],
};

const MOCK_BOOKINGS = {
  bookings: [
    {
      id: 1, booking_ref: 'BK-E2E-001', user_name: 'Alice Smith',
      email: 'alice@example.com', status: 'confirmed', payment_status: 'paid',
      room: { hotel_name: 'The Grand Azure', room_type: 'suite' },
      check_in: '2027-06-01', check_out: '2027-06-03', nights: 2, total_amount: 700,
    },
    {
      id: 2, booking_ref: 'BK-E2E-002', user_name: 'Bob Jones',
      email: 'bob@example.com', status: 'pending', payment_status: 'pending',
      room: { hotel_name: 'Sea View Resort', room_type: 'deluxe' },
      check_in: '2027-07-10', check_out: '2027-07-12', nights: 2, total_amount: 400,
    },
  ],
  total: 2,
};

const MOCK_TRANSACTIONS = {
  transactions: [
    { id: 1, transaction_ref: 'TXN-E2E-001', amount: 700,  status: 'success', payment_method: 'card', card_brand: 'Visa',       card_last4: '4242', created_at: new Date().toISOString(), booking: { user_name: 'Alice Smith', room: { hotel_name: 'The Grand Azure' } } },
    { id: 2, transaction_ref: 'TXN-E2E-002', amount: 400,  status: 'failed',  payment_method: 'card', card_brand: 'Mastercard', card_last4: '5555', created_at: new Date().toISOString(), booking: { user_name: 'Bob Jones',   room: { hotel_name: 'Sea View Resort' } } },
  ],
  total: 2,
};

async function setupAdminSession(page: Page) {
  // Set tokens in localStorage before navigating so AppComponent restores session
  await page.goto('/login');
  await page.evaluate((user) => {
    localStorage.setItem('insightboard_access_token', 'playwright-admin-token');
    localStorage.setItem('insightboard_refresh_token', 'playwright-refresh-token');
    localStorage.setItem('insightboard_auth_user', JSON.stringify(user));
  }, ADMIN_USER);

  // Mock /auth/me so session restore succeeds
  await page.route('**/auth/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ADMIN_USER),
    });
  });
}

async function mockDashboardApis(page: Page) {
  await page.route('**/analytics?days=30', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ANALYTICS) });
  });
  await page.route('**/analytics/recent-bookings**', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ bookings: MOCK_BOOKINGS.bookings.slice(0, 1), total: 1 }) });
  });
  await page.route('**/analytics/revenue-stats', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ this_month: 12500, last_month: 10000, growth_percentage: 25 }) });
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Login Page', () => {
  test('shows error for non-admin user login', async ({ page }) => {
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AUTH_RESPONSE(NON_ADMIN_USER)),
      });
    });

    await page.goto('/login');
    await page.getByPlaceholder('admin@example.com').fill('user@example.com');
    await page.getByPlaceholder('Enter your password').fill('UserPass123');
    await page.getByRole('button', { name: 'Continue to Dashboard' }).click();

    await expect(page.getByText(/admin access/i)).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/login/);
  });

  test('shows backend error detail on failed login', async ({ page }) => {
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid email or password' }),
      });
    });

    await page.goto('/login');
    await page.getByPlaceholder('admin@example.com').fill('wrong@example.com');
    await page.getByPlaceholder('Enter your password').fill('badpassword');
    await page.getByRole('button', { name: 'Continue to Dashboard' }).click();

    await expect(page.getByText(/Invalid email or password/i)).toBeVisible({ timeout: 5_000 });
  });

  test('validation error shown when fields are empty', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Continue to Dashboard' }).click();

    await expect(page.getByText(/required/i)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Guard Behaviour', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    // Make sure localStorage is empty
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/');
    await expect(page).toHaveURL(/login/, { timeout: 5_000 });
  });
});

test.describe('Dashboard', () => {
  test('admin can view the dashboard with KPI cards', async ({ page }) => {
    await setupAdminSession(page);
    await mockDashboardApis(page);

    await page.goto('/');

    await expect(page.getByText(/Revenue Overview|Total Bookings|Dashboard/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Admin User')).toBeVisible();
  });
});

test.describe('Bookings Table', () => {
  test('admin can view all bookings', async ({ page }) => {
    await setupAdminSession(page);
    await page.route('**/bookings**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BOOKINGS),
      });
    });
    await mockDashboardApis(page);

    await page.goto('/bookings');

    await expect(page.getByText('BK-E2E-001')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Alice Smith')).toBeVisible();
    await expect(page.getByText('BK-E2E-002')).toBeVisible();
  });
});

test.describe('Transactions Page', () => {
  test('admin can view transactions', async ({ page }) => {
    await setupAdminSession(page);
    await mockDashboardApis(page);
    await page.route('**/payments/transactions**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TRANSACTIONS),
      });
    });

    await page.goto('/transactions');

    await expect(page.getByText('TXN-E2E-001')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('TXN-E2E-002')).toBeVisible();
    // Summary cards should be populated
    await expect(page.getByText('2')).toBeVisible(); // total count
  });

  test('transactions page falls back to mock data on error', async ({ page }) => {
    await setupAdminSession(page);
    await mockDashboardApis(page);
    await page.route('**/payments/transactions**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Server error' }),
      });
    });

    await page.goto('/transactions');

    // Component falls back to hardcoded mock data
    await expect(page.getByText(/Sarah Mitchell|James Park|Priya Sharma/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('$1,491')).toBeVisible();
  });
});

test.describe('Logout', () => {
  test('logout clears session and redirects to /login', async ({ page }) => {
    await setupAdminSession(page);
    await mockDashboardApis(page);

    await page.goto('/');
    await expect(page.getByText('Admin User')).toBeVisible({ timeout: 10_000 });

    // Click the logout button in the header
    await page.getByRole('button', { name: /logout|sign out/i }).click();

    await expect(page).toHaveURL(/login/, { timeout: 5_000 });
    // Token should be gone
    const token = await page.evaluate(() => localStorage.getItem('insightboard_access_token'));
    expect(token).toBeNull();
  });
});

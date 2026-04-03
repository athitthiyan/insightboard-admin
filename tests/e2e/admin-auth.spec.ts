import { test, expect } from '@playwright/test';

test('admin can sign in and reach the protected dashboard shell', async ({ page }) => {
  await page.route('**/auth/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'playwright-access-token',
        refresh_token: 'playwright-refresh-token',
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'admin@example.com',
          full_name: 'Admin User',
          is_admin: true,
          is_active: true,
        },
      }),
    });
  });

  await page.route('**/analytics?days=30', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kpis: {
          total_bookings: 12,
          total_revenue: 5400,
          success_rate: 92,
          avg_booking_value: 450,
          bookings_today: 2,
          revenue_today: 900,
          pending_bookings: 1,
          failed_payments: 0,
        },
        daily_stats: [{ date: '2026-04-01', bookings: 2, revenue: 900 }],
        monthly_revenue: [{ month: 'Apr', revenue: 5400, bookings: 12 }],
        payment_breakdown: [{ status: 'paid', count: 12, percentage: 100 }],
        room_type_breakdown: [{ room_type: 'suite', count: 12, revenue: 5400 }],
      }),
    });
  });

  await page.route('**/analytics/recent-bookings?limit=5', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        bookings: [
          {
            id: 101,
            user_name: 'Sarah Mitchell',
            email: 'sarah@example.com',
            check_in: '2026-04-10T00:00:00Z',
            total_amount: 450,
            status: 'confirmed',
            room: { hotel_name: 'The Grand Azure', room_type: 'suite' },
          },
        ],
        total: 1,
      }),
    });
  });

  await page.route('**/analytics/revenue-stats', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ this_month: 5400, last_month: 4200, growth: 28.57 }),
    });
  });

  await page.goto('/login');
  await page.getByPlaceholder('admin@example.com').fill('admin@example.com');
  await page.getByPlaceholder('Enter your password').fill('AdminPass123');
  await page.getByRole('button', { name: 'Continue to Dashboard' }).click();

  await expect(page).toHaveURL('http://127.0.0.1:4202/');
  await expect(page.getByText('Admin User')).toBeVisible();
  await expect(page.getByText('Revenue Overview')).toBeVisible();
  await expect(page.getByText('Recent Bookings')).toBeVisible();
});

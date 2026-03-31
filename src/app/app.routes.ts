import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'InsightBoard — Overview',
  },
  {
    path: 'bookings',
    loadComponent: () =>
      import('./features/bookings-table/bookings-table.component').then(m => m.BookingsTableComponent),
    title: 'Bookings — InsightBoard',
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./features/transactions/transactions.component').then(m => m.TransactionsComponent),
    title: 'Transactions — InsightBoard',
  },
  { path: '**', redirectTo: '' },
];

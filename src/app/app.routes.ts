import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/guards/admin-auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(m => m.LoginComponent),
    title: 'Admin Login - InsightBoard',
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'InsightBoard - Overview',
    canActivate: [adminAuthGuard],
  },
  {
    path: 'bookings',
    loadComponent: () =>
      import('./features/bookings-table/bookings-table.component').then(m => m.BookingsTableComponent),
    title: 'Bookings - InsightBoard',
    canActivate: [adminAuthGuard],
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./features/transactions/transactions.component').then(m => m.TransactionsComponent),
    title: 'Transactions - InsightBoard',
    canActivate: [adminAuthGuard],
  },
  {
    path: 'incidents',
    loadComponent: () =>
      import('./features/incidents/incidents.component').then(m => m.IncidentsComponent),
    title: 'Incidents - InsightBoard',
    canActivate: [adminAuthGuard],
  },
  { path: '**', redirectTo: '' },
];

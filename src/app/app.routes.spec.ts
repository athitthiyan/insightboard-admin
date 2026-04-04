import { routes } from './app.routes';

describe('routes', () => {
  it('defines login and protected admin pages', () => {
    expect(routes.map(route => route.path)).toEqual([
      'login',
      '',
      'bookings',
      'transactions',
      '**',
    ]);
  });

  it('protects the admin pages', () => {
    expect(routes.find(route => route.path === 'login')?.canActivate).toBeUndefined();
    expect(routes.find(route => route.path === '')?.canActivate?.length).toBe(1);
    expect(routes.find(route => route.path === 'bookings')?.canActivate?.length).toBe(1);
    expect(routes.find(route => route.path === 'transactions')?.canActivate?.length).toBe(1);
    expect(routes.find(route => route.path === '**')?.redirectTo).toBe('');
  });

  it('lazy-loads each page component', async () => {
    const loaded = await Promise.all(
      routes
        .filter(route => route.loadComponent)
        .map(route => route.loadComponent!())
    );

    expect(loaded).toHaveLength(4);
    expect(loaded.every(component => !!component)).toBe(true);
  });
});

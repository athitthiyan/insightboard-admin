import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

import { adminAuthGuard } from './admin-auth.guard';
import { AuthService } from '../services/auth.service';

describe('adminAuthGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  it('allows navigation for authenticated admins', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => true,
            isAdmin: () => true,
          },
        },
        {
          provide: Router,
          useValue: { createUrlTree: jest.fn() },
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() => adminAuthGuard(route, state));

    expect(result).toBe(true);
  });

  it('redirects unauthenticated users to login', () => {
    const urlTree = { redirected: true };
    const router = { createUrlTree: jest.fn().mockReturnValue(urlTree) };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => false,
            isAdmin: () => false,
          },
        },
        {
          provide: Router,
          useValue: router,
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() => adminAuthGuard(route, state));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(urlTree);
  });
});

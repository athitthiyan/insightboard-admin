import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard for admin-only routes in InsightBoard.
 *
 * Checks admin status from the AuthService signal (populated from API on login/refresh).
 * The backend is the ultimate authority — the isAdmin flag comes from the JWT/session
 * which is verified server-side on every API request. This guard is a UX convenience
 * to prevent non-admins from seeing admin pages.
 *
 * @returns true if user is authenticated admin, UrlTree to /login otherwise
 */
export const adminAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // isAdmin is derived from the server-verified user profile set during login/refresh.
  // Backend enforces admin-only access on every API endpoint independently.
  if (auth.isAuthenticated() && auth.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

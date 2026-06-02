/**
 * Purpose:     Functional route guard that blocks unauthenticated users.
 * Responsibility: Inspect the current AuthService state when a route is
 *                about to activate. If no JWT is present, redirect to
 *                /login. Otherwise allow the activation.
 * Interactions: Listed in app.routes.ts under the protected `''` shell.
 *                Reads AuthService.isAuthenticated().
 *
 * What is a "guard"?
 *   A guard is a function Angular calls BEFORE activating a route. If the
 *   function returns `true`, navigation proceeds. If it returns `false`,
 *   navigation is cancelled. If it returns a UrlTree, Angular redirects
 *   to that URL instead — which is what we do here.
 *
 * Why CanActivateFn (functional) and not a class?
 *   - Less boilerplate. No need for @Injectable + class with one method.
 *   - It uses Angular's `inject()` API, so it composes naturally with
 *     the rest of our standalone, signal-based code.
 */

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  // Preserve the originally requested URL so we could bounce the user
  // back after login. (Not consumed in this tutorial, but a good habit.)
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

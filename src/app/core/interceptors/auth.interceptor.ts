/**
 * Purpose:     Attach the JWT to every outgoing API request.
 * Responsibility: A functional HttpInterceptor that adds
 *                `Authorization: Bearer <token>` to the request headers
 *                IF a token is present in AuthService.
 * Interactions: Registered globally in app.config.ts via
 *                `withInterceptors([authInterceptor])`. Runs before every
 *                HttpClient call.
 *
 * What is an "interceptor"?
 *   An interceptor is a function that sits in the middle of an HTTP
 *   request (or response). It receives the original request, can modify
 *   it (headers, body, URL), and then forwards it on. For responses it
 *   can transform or short-circuit them. Think of it like a pipeline
 *   stage: every request flows through every registered interceptor.
 *
 * Why "Bearer" tokens?
 *   "Bearer" is the IETF-standard authentication scheme (RFC 6750).
 *   It tells the server "the holder of this token is allowed in".
 *
 * Why skip the auth endpoints?
 *   /api/auth/login and /api/auth/register are the endpoints that
 *   ISSUE the token — we obviously cannot send one we don't have yet.
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

const PUBLIC_PATHS = ['/auth/login', '/auth/register'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  // If we are calling a public endpoint OR there's no token, pass through.
  const isPublic = PUBLIC_PATHS.some((p) => req.url.includes(p));
  if (isPublic || !token) {
    return next(req);
  }

  // Clone the request and attach the Authorization header. HttpRequest
  // instances are immutable — that's why we have to clone.
  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });

  return next(authReq);
};

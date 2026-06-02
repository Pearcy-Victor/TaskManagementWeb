/**
 * Purpose:     Centralised error-handling helper.
 * Responsibility: Convert Angular's HttpErrorResponse into a single,
 *                human-readable string the UI can display. Also exposes a
 *                `lastError` signal so any component can react to the
 *                most recent error (e.g. a global toast in the future).
 * Interactions: Called by every service right before throwing, and by
 *                components that want to show an error inline.
 */

import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  /** Reactive handle on the most recent error message. */
  readonly lastError = signal<string | null>(null);

  /**
   * Extracts a user-friendly message from an HttpErrorResponse.
   * Strategy:
   *   1. If the server returned `{ message: '...' }`, use that.
   *   2. Else, if the server returned a validation error bag, join them.
   *   3. Else, fall back to a status-code-based message.
   *   4. Else, use the generic `Unknown error`.
   */
  extractMessage(err: HttpErrorResponse): string {
    // 1) Plain `{ message }` payload (our API uses this shape).
    if (err.error && typeof err.error === 'object' && 'message' in err.error) {
      const msg = (err.error as { message: unknown }).message;
      if (typeof msg === 'string' && msg.trim().length > 0) {
        return msg;
      }
    }

    // 2) ASP.NET model-state validation bag: { errors: { Field: ['msg'] } }.
    if (err.error && typeof err.error === 'object' && 'errors' in err.error) {
      const errors = (err.error as { errors: unknown }).errors;
      if (errors && typeof errors === 'object') {
        const flat = Object.values(errors as Record<string, string[]>)
          .flat()
          .filter(Boolean);
        if (flat.length) return flat.join(' ');
      }
    }

    // 3) Status-code fallback.
    switch (err.status) {
      case 0:   return 'Cannot reach the server. Is the API running?';
      case 400: return 'The request was invalid.';
      case 401: return 'You are not authenticated.';
      case 403: return 'You do not have permission to do that.';
      case 404: return 'The requested resource was not found.';
      case 500: return 'A server error occurred. Please try again later.';
      default:  return err.statusText || `Unexpected error (${err.status}).`;
    }
  }

  /** Record an error so subscribers (UI toasts etc.) can react. */
  report(err: HttpErrorResponse): string {
    const msg = this.extractMessage(err);
    this.lastError.set(msg);
    return msg;
  }

  /** Clear the most recent error (e.g. when navigating away). */
  clear(): void {
    this.lastError.set(null);
  }
}
